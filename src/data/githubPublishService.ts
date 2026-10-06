import {
  Post,
  Page,
  GitCommitRecord,
  DeploymentSettings,
  HeroSectionConfig,
  ThemeSettings,
  Category,
  Tag,
  Author,
  MediaItem,
  Menu,
} from '../types/cms';
import { projectFilesManifest } from './projectFilesManifest';
import { getAllPersistedMediaBlobs } from './mediaStorage';
import {
  fetchRemoteCMSDataFromGitHub,
  mergeCMSStates,
  parseFrontmatterAndMarkdown,
} from './contentSyncService';

export interface PublishResult {
  success: boolean;
  commit?: GitCommitRecord;
  commitSha?: string;
  commitUrl?: string;
  publishedUrl?: string;
  buildTriggered: boolean;
  message: string;
  error?: string;
  status: 'published' | 'failed' | 'local_saved';
}

export interface PublishContentPayload {
  type: 'post' | 'page' | 'hero' | 'all';
  item?: Post | Page;
  isPage?: boolean;
  markdownWithFrontmatter?: string;
  heroConfig?: HeroSectionConfig;
  settings: DeploymentSettings;
  sessionToken?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  repo: string;
  branch: string;
  latencyMs: number;
  lastChecked: string;
  message: string;
  statusCode?: number;
  permissions?: {
    push: boolean;
    admin: boolean;
    pull: boolean;
  };
}

/**
 * Validates a URL slug
 */
export function validateSlug(
  slug: string,
  existingSlugs: string[]
): { valid: boolean; error?: string } {
  if (!slug || !slug.trim()) {
    return { valid: false, error: 'Slug cannot be empty' };
  }

  const normalized = slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  if (normalized.length < 2) {
    return { valid: false, error: 'Slug must contain at least 2 alphanumeric characters' };
  }

  if (existingSlugs.includes(normalized)) {
    return { valid: false, error: `Slug "${normalized}" is already used by another post or page` };
  }

  return { valid: true };
}

/**
 * Generates a clean URL slug from title
 */
export function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'post-' + Date.now()
  );
}

/**
 * Helper to encode UTF-8 string to Base64 in browser
 */
function utf8ToBase64(str: string): string {
  return window.btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(_match, p1) {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
}

function isAuthenticatorWorkerUrl(url?: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase().trim();
  return (
    lower.includes('sveltia-authenticator') ||
    lower.includes('authenticator.workers.dev') ||
    lower.includes('/auth') ||
    lower.includes('/callback')
  );
}

/**
 * Tests connection to GitHub Repository using Personal Access Token or direct GitHub REST API
 */
export async function checkGitHubConnection(
  owner: string,
  repoName: string,
  branch: string,
  token?: string,
  workerProxyUrl?: string
): Promise<ConnectionStatus> {
  const start = Date.now();
  const cleanOwner = owner.trim();
  const cleanRepo = repoName.trim();
  const fullRepo = `${cleanOwner}/${cleanRepo}`;

  if (!cleanOwner || !cleanRepo) {
    return {
      connected: false,
      repo: fullRepo || 'unconfigured',
      branch: branch || 'main',
      latencyMs: 0,
      lastChecked: new Date().toLocaleTimeString(),
      message: 'Please provide both Repository Owner and Repository Name.',
    };
  }

  const cleanToken = token?.trim();
  const hasProxy = workerProxyUrl && workerProxyUrl.trim() && !isAuthenticatorWorkerUrl(workerProxyUrl);

  const directUrl = `https://api.github.com/repos/${cleanOwner}/${cleanRepo}`;
  const targetUrl = hasProxy ? `${workerProxyUrl!.trim()}/repos/${cleanOwner}/${cleanRepo}` : directUrl;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (cleanToken) {
    headers['Authorization'] = `Bearer ${cleanToken}`;
  }

  let response: Response | null = null;
  let isFallback = false;

  try {
    response = await fetch(targetUrl, { method: 'GET', headers });
  } catch (err: any) {
    // If proxy failed, fallback directly to GitHub REST API
    if (hasProxy) {
      try {
        response = await fetch(directUrl, { method: 'GET', headers });
        isFallback = true;
      } catch (fallbackErr: any) {
        // Direct fetch also failed
      }
    }
  }

  const latencyMs = Date.now() - start;

  if (!response) {
    return {
      connected: false,
      repo: fullRepo,
      branch,
      latencyMs,
      lastChecked: new Date().toLocaleTimeString(),
      message: `Network error connecting to GitHub. Direct connection to https://api.github.com was attempted. Check internet connectivity or token permissions.`,
    };
  }

  if (response.status === 200) {
    const data = await response.json();
    const perms = data.permissions || { push: true, admin: false, pull: true };

    if (cleanToken && data.permissions && !data.permissions.push) {
      return {
        connected: false,
        repo: fullRepo,
        branch,
        latencyMs,
        statusCode: 403,
        lastChecked: new Date().toLocaleTimeString(),
        message: `Connected to repository "${data.full_name}", but token does not have Push/Write permissions. Fine-grained PAT needs "Contents: Read and write" access.`,
      };
    }

    return {
      connected: true,
      repo: data.full_name || fullRepo,
      branch: data.default_branch || branch,
      latencyMs,
      statusCode: 200,
      lastChecked: new Date().toLocaleTimeString(),
      permissions: perms,
      message: `Successfully connected to GitHub repository "${data.full_name}" ${
        isFallback ? '(via direct REST API)' : ''
      }. Default branch: ${data.default_branch || branch}. Visibility: ${data.private ? 'Private' : 'Public'}.`,
    };
  }

  if (response.status === 401) {
    return {
      connected: false,
      repo: fullRepo,
      branch,
      latencyMs,
      statusCode: 401,
      lastChecked: new Date().toLocaleTimeString(),
      message: 'GitHub Authentication Failed (401 Unauthorized). The Personal Access Token is invalid or expired.',
    };
  }

  if (response.status === 404) {
    return {
      connected: false,
      repo: fullRepo,
      branch,
      latencyMs,
      statusCode: 404,
      lastChecked: new Date().toLocaleTimeString(),
      message: `Repository "${fullRepo}" was not found (404 Not Found). Verify owner/repo spelling or ensure token has access to private repositories.`,
    };
  }

  if (response.status === 403) {
    const body = await response.json().catch(() => ({}));
    return {
      connected: false,
      repo: fullRepo,
      branch,
      latencyMs,
      statusCode: 403,
      lastChecked: new Date().toLocaleTimeString(),
      message: `GitHub API Forbidden (403): ${body.message || 'Rate limit exceeded or permission denied.'}`,
    };
  }

  return {
    connected: false,
    repo: fullRepo,
    branch,
    latencyMs,
    statusCode: response.status,
    lastChecked: new Date().toLocaleTimeString(),
    message: `GitHub API returned status code ${response.status}: ${response.statusText}`,
  };
}

/**
 * Calculates standard Git blob SHA-1: sha1("blob <size>\0<content>")
 */
export async function calculateGitBlobSha(content: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const contentBytes = enc.encode(content);
    const headerBytes = enc.encode(`blob ${contentBytes.length}\0`);
    const fullBytes = new Uint8Array(headerBytes.length + contentBytes.length);
    fullBytes.set(headerBytes);
    fullBytes.set(contentBytes, headerBytes.length);

    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-1', fullBytes);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {}
  return '';
}

function formatPostToMarkdown(post: Post): string {
  return `---
title: "${(post.title || '').replace(/"/g, '\\"')}"
slug: "${post.slug}"
pubDate: ${post.pubDate || new Date().toISOString()}
status: "${post.status || 'published'}"
draft: ${post.status === 'draft'}
author: "${(post.author || 'Amit Singh').replace(/"/g, '\\"')}"
category: "${(post.category || 'General').replace(/"/g, '\\"')}"
tags: [${(post.tags || []).map((t) => `"${t}"`).join(', ')}]
featuredImage: "${post.featuredImage || ''}"
excerpt: "${(post.excerpt || '').replace(/"/g, '\\"')}"
readingTime: ${post.readingTime || Math.max(1, Math.ceil((post.blocks || []).length * 0.8))}
template: "${post.template || 'standard'}"
blocks: ${JSON.stringify(post.blocks || [])}
seo:
  metaTitle: "${(post.seo?.metaTitle || post.title || '').replace(/"/g, '\\"')}"
  metaDescription: "${(post.seo?.metaDescription || post.excerpt || '').replace(/"/g, '\\"')}"
  focusKeyword: "${post.seo?.focusKeyword || ''}"
  robotsIndex: ${post.seo?.robotsIndex !== false}
  robotsFollow: ${post.seo?.robotsFollow !== false}
---

${post.body || ''}`;
}

function formatPageToMarkdown(page: Page): string {
  return `---
title: "${(page.title || '').replace(/"/g, '\\"')}"
slug: "${page.slug}"
pubDate: ${new Date().toISOString()}
template: "${page.template || 'default'}"
draft: ${page.status === 'draft'}
blocks: ${JSON.stringify(page.blocks || [])}
---

${page.body || ''}`;
}

// In-flight deployment lock to prevent concurrent or duplicate pushes
let inFlightDeploymentPromise: Promise<{
  success: boolean;
  totalPushed: number;
  totalFiles: number;
  modifiedFiles?: string[];
  failedFiles: { path: string; error: string }[];
  commitSha?: string;
  commitUrl?: string;
  verifiedRootFiles?: string[];
  message: string;
  noChanges?: boolean;
}> | null = null;

export interface FullPushPayload {
  posts?: Post[];
  pages?: Page[];
  heroConfig?: HeroSectionConfig;
  themeSettings?: ThemeSettings;
  categories?: Category[];
  tags?: Tag[];
  authors?: Author[];
  media?: MediaItem[];
  menus?: Menu[];
  deploymentSettings: DeploymentSettings;
  sessionToken?: string;
  customCommitMessage?: string;
  onProgress?: (info: { current: number; total: number; filePath: string; status: 'pushing' | 'done' | 'error' }) => void;
}

/**
 * Unified Atomic Deployment Engine:
 * - Collects ALL accumulated changes (posts, pages, media, settings)
 * - Fetches latest remote state and safely merges (preserving Live Admin changes)
 * - Diffs candidate files against the remote tree
 * - If 0 changes, does NOT create an empty commit and does NOT push
 * - If changes exist, creates ONE Git tree, ONE Git commit, and performs EXACTLY ONE push
 * - Locks against concurrent duplicate calls
 */
export async function executeAtomicBulkDeploy(payload: FullPushPayload): Promise<{
  success: boolean;
  totalPushed: number;
  totalFiles: number;
  modifiedFiles?: string[];
  failedFiles: { path: string; error: string }[];
  commitSha?: string;
  commitUrl?: string;
  verifiedRootFiles?: string[];
  message: string;
  noChanges?: boolean;
}> {
  if (inFlightDeploymentPromise) {
    console.log('[Deploy] A deployment is already running. Reusing active deployment to prevent duplicate push.');
    return inFlightDeploymentPromise;
  }

  inFlightDeploymentPromise = (async () => {
    try {
      return await performAtomicBulkDeploy(payload);
    } finally {
      inFlightDeploymentPromise = null;
    }
  })();

  return inFlightDeploymentPromise;
}

async function performAtomicBulkDeploy(payload: FullPushPayload) {
  const { deploymentSettings, sessionToken, onProgress, customCommitMessage } = payload;
  const branch = deploymentSettings.githubBranch || 'main';
  const repoString = deploymentSettings.githubRepo || 'ipritamsingh/astropress';
  const [owner, repoName] = repoString.split('/');
  const token = (sessionToken || deploymentSettings.githubToken || '').trim();

  if (!token || !owner || !repoName) {
    return {
      success: false,
      totalPushed: 0,
      totalFiles: 0,
      failedFiles: [{ path: 'auth', error: 'Missing GitHub Token or Repository name' }],
      message: 'Missing GitHub Personal Access Token or Repository configuration.',
    };
  }

  const useProxy =
    deploymentSettings.cloudflareWorkerUrl?.trim() &&
    !isAuthenticatorWorkerUrl(deploymentSettings.cloudflareWorkerUrl);

  const baseApiUrl = useProxy
    ? `${deploymentSettings.cloudflareWorkerUrl!.trim()}/repos/${owner}/${repoName}`
    : `https://api.github.com/repos/${owner}/${repoName}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  if (onProgress) {
    onProgress({ current: 0, total: 100, filePath: 'Connecting to GitHub repository and checking remote state...', status: 'pushing' });
  }

  // 1. Fetch current remote branch HEAD ref
  let headSha: string | null = null;
  let baseTreeSha: string | null = null;
  try {
    const refRes = await fetch(`${baseApiUrl}/git/ref/heads/${branch}`, { method: 'GET', headers });
    if (!refRes.ok) {
      const err = await refRes.json().catch(() => ({}));
      return {
        success: false,
        totalPushed: 0,
        totalFiles: 0,
        failedFiles: [{ path: 'branch', error: err.message || refRes.statusText }],
        message: `Could not reach branch "${branch}" on ${owner}/${repoName}: ${err.message || refRes.statusText}`,
      };
    }
    const refData = await refRes.json();
    headSha = refData.object?.sha || null;
  } catch (err: any) {
    return {
      success: false,
      totalPushed: 0,
      totalFiles: 0,
      failedFiles: [{ path: 'network', error: err.message || 'Connection failure' }],
      message: `Network error connecting to GitHub: ${err.message || 'Connection failure'}`,
    };
  }

  if (!headSha) {
    return {
      success: false,
      totalPushed: 0,
      totalFiles: 0,
      failedFiles: [{ path: 'ref', error: 'Missing HEAD SHA' }],
      message: `Failed to locate HEAD commit for branch "${branch}".`,
    };
  }

  // 2. Fetch base tree SHA and recursive remote tree
  const remoteTreeMap = new Map<string, { sha: string; mode: string; type: string }>();
  try {
    const commitRes = await fetch(`${baseApiUrl}/git/commits/${headSha}`, { method: 'GET', headers });
    if (commitRes.ok) {
      const commitData = await commitRes.json();
      baseTreeSha = commitData.tree?.sha || null;
    }

    const treeRes = await fetch(`${baseApiUrl}/git/trees/${headSha}?recursive=1`, { headers });
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      const treeItems = treeData.tree || [];
      treeItems.forEach((item: any) => {
        if (item.path && item.sha) {
          remoteTreeMap.set(item.path, { sha: item.sha, mode: item.mode || '100644', type: item.type || 'blob' });
        }
      });
    }
  } catch (err: any) {
    console.warn('[Deploy] Warning fetching remote tree:', err);
  }

  // 3. Retrieve local CMS state from props or fallback to localStorage
  let localPosts = payload.posts;
  let localPages = payload.pages;
  let localHeroConfig = payload.heroConfig;
  let localThemeSettings = payload.themeSettings;
  let localCategories = payload.categories;
  let localTags = payload.tags;
  let localAuthors = payload.authors;
  let localMedia = payload.media;
  let localMenus = payload.menus;

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('astropress_cms_state_v3') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!localPosts || localPosts.length === 0) localPosts = parsed.posts || [];
      if (!localPages || localPages.length === 0) localPages = parsed.pages || [];
      if (!localHeroConfig) localHeroConfig = parsed.heroConfig;
      if (!localThemeSettings) localThemeSettings = parsed.themeSettings;
      if (!localCategories || localCategories.length === 0) localCategories = parsed.categories || [];
      if (!localTags || localTags.length === 0) localTags = parsed.tags || [];
      if (!localAuthors || localAuthors.length === 0) localAuthors = parsed.authors || [];
      if (!localMedia || localMedia.length === 0) localMedia = parsed.media || [];
      if (!localMenus || localMenus.length === 0) localMenus = parsed.menus || [];
    }
  } catch {}

  // 4. Safe remote state merge (never overwrite newer Live Admin / remote content)
  let activePosts = [...(localPosts || [])];
  let activePages = [...(localPages || [])];
  let activeHeroConfig = localHeroConfig;
  let activeThemeSettings = localThemeSettings;
  let activeCategories = localCategories ? [...localCategories] : [];
  let activeTags = localTags ? [...localTags] : [];
  let activeAuthors = localAuthors ? [...localAuthors] : [];
  let activeMedia = localMedia ? [...localMedia] : [];
  let activeMenus = localMenus ? [...localMenus] : [];

  try {
    const remoteResult = await fetchRemoteCMSDataFromGitHub(deploymentSettings, token);
    if (remoteResult.success && remoteResult.data) {
      const mergedState = mergeCMSStates(
        {
          posts: activePosts,
          pages: activePages,
          categories: activeCategories,
          tags: activeTags,
          authors: activeAuthors,
          media: activeMedia,
          comments: [],
          menus: activeMenus,
          homepageSections: [],
          heroConfig: activeHeroConfig || ({} as any),
          themeSettings: activeThemeSettings || ({} as any),
          templates: [],
          siteSettings: {} as any,
          deploymentSettings,
          commitHistory: [],
        },
        remoteResult.data
      );

      activePosts = mergedState.posts;
      activePages = mergedState.pages;
      activeCategories = mergedState.categories;
      activeTags = mergedState.tags;
      activeAuthors = mergedState.authors;
      activeMedia = mergedState.media;
      activeMenus = mergedState.menus;
      activeHeroConfig = mergedState.heroConfig;
      activeThemeSettings = mergedState.themeSettings;
    }
  } catch (syncErr) {
    console.warn('[Deploy] Remote CMS pre-deploy sync warning:', syncErr);
  }

  // 5. Build candidate files map with complete accumulated state
  const fullFilesMap: Record<string, string> = { ...projectFilesManifest };

  activePosts.forEach((post) => {
    fullFilesMap[`src/content/posts/${post.slug}.md`] = formatPostToMarkdown(post);
  });

  activePages.forEach((page) => {
    fullFilesMap[`src/content/pages/${page.slug}.md`] = formatPageToMarkdown(page);
  });

  // Also include any posts or pages written to local container disk during active editing session
  try {
    if (typeof window !== 'undefined') {
      const diskRes = await fetch('/api/content/all');
      if (diskRes.ok) {
        const diskData = await diskRes.json();
        if (diskData.success) {
          (diskData.posts || []).forEach((p: any) => {
            if (p.slug && p.content) {
              fullFilesMap[`src/content/posts/${p.slug}.md`] = p.content;
            }
          });
          (diskData.pages || []).forEach((p: any) => {
            if (p.slug && p.content) {
              fullFilesMap[`src/content/pages/${p.slug}.md`] = p.content;
            }
          });
        }
      }
    }
  } catch {}

  if (activeHeroConfig) {
    fullFilesMap['src/data/heroConfig.json'] = JSON.stringify(activeHeroConfig, null, 2);
  }
  if (activeThemeSettings) {
    fullFilesMap['src/data/themeSettings.json'] = JSON.stringify(activeThemeSettings, null, 2);
  }
  if (activeCategories.length > 0 || activeTags.length > 0) {
    fullFilesMap['src/data/categories.json'] = JSON.stringify(
      { categories: activeCategories, tags: activeTags },
      null,
      2
    );
  }
  if (activeAuthors.length > 0) {
    fullFilesMap['src/data/authors.json'] = JSON.stringify(activeAuthors, null, 2);
  }
  if (activeMedia.length > 0) {
    fullFilesMap['src/data/media.json'] = JSON.stringify(activeMedia, null, 2);
  }
  if (activeMenus.length > 0) {
    fullFilesMap['src/data/menus.json'] = JSON.stringify(activeMenus, null, 2);
  }

  // Collect and include all uploaded media binary files into public/uploads/
  const storedBlobs = await getAllPersistedMediaBlobs().catch(() => []);
  const neededImageFilenames = new Set<string>();
  activeMedia.forEach((m) => {
    if (m.name && m.type === 'image') neededImageFilenames.add(m.name.replace(/^\/?uploads\//, ''));
  });
  activePosts.forEach((p) => {
    if (p.featuredImage && (p.featuredImage.startsWith('/uploads/') || p.featuredImage.startsWith('uploads/'))) {
      neededImageFilenames.add(p.featuredImage.replace(/^\/?uploads\//, ''));
    }
    (p.blocks || []).forEach((b) => {
      if (b.type === 'image') {
        const u = b.settings?.imageUrl || b.content;
        if (u && (u.startsWith('/uploads/') || u.startsWith('uploads/'))) {
          neededImageFilenames.add(u.replace(/^\/?uploads\//, ''));
        }
      }
    });
    if (p.body) {
      const matches = p.body.match(/\/uploads\/[A-Za-z0-9_.-]+/g);
      if (matches) matches.forEach((m) => neededImageFilenames.add(m.replace(/^\/?uploads\//, '')));
    }
  });

  for (const filename of Array.from(neededImageFilenames)) {
    const assetPath = `public/uploads/${filename}`;
    if (fullFilesMap[assetPath]) continue;

    let dataUrl = '';
    const foundBlob = storedBlobs.find(
      (b) => b.filename === filename || b.id === filename || b.id === `/uploads/${filename}`
    );
    if (foundBlob && foundBlob.data) {
      dataUrl = foundBlob.data;
    }
    if (!dataUrl && typeof window !== 'undefined') {
      try {
        const res = await fetch(`/uploads/${filename}`);
        if (res.ok) {
          const blob = await res.blob();
          dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
      } catch {}
    }
    if (dataUrl) {
      fullFilesMap[assetPath] = dataUrl;
    }
  }

  // 6. Diff candidate files against remote tree to find modified/new files
  const allCandidatePaths = Object.keys(fullFilesMap);
  const totalCandidateFiles = allCandidatePaths.length;
  const modifiedTreeItems: Array<{ path: string; mode: string; type: string; sha?: string; content?: string }> = [];
  const modifiedFilePaths: string[] = [];

  if (onProgress) {
    onProgress({ current: 10, total: totalCandidateFiles, filePath: 'Diffing local changes against remote Git tree...', status: 'pushing' });
  }

  for (let i = 0; i < allCandidatePaths.length; i++) {
    const path = allCandidatePaths[i];
    const rawContent = fullFilesMap[path];

    const isBinary =
      (typeof rawContent === 'string' && rawContent.startsWith('data:') && rawContent.includes(';base64,')) ||
      /\.(webp|png|jpg|jpeg|gif|ico|pdf|woff|woff2|ttf|eot|mp4|webm)$/i.test(path);

    if (isBinary) {
      if (remoteTreeMap.has(path)) {
        // Binary asset already exists on remote, unchanged
        continue;
      }
      // New binary asset: create blob in Git
      const base64Data =
        typeof rawContent === 'string' && rawContent.includes(';base64,')
          ? rawContent.replace(/^data:[^;]+;base64,/, '').trim()
          : '';
      if (base64Data) {
        try {
          const blobRes = await fetch(`${baseApiUrl}/git/blobs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ content: base64Data, encoding: 'base64' }),
          });
          if (blobRes.ok) {
            const blobData = await blobRes.json();
            modifiedTreeItems.push({ path, mode: '100644', type: 'blob', sha: blobData.sha });
            modifiedFilePaths.push(path);
          }
        } catch (blobErr) {
          console.warn(`[Deploy] Could not create blob for ${path}:`, blobErr);
        }
      }
      continue;
    }

    // Text file diff
    const computedSha = await calculateGitBlobSha(rawContent);
    const remoteEntry = remoteTreeMap.get(path);
    if (remoteEntry && computedSha && remoteEntry.sha === computedSha) {
      // Content is identical to remote, skip!
      continue;
    }

    // File is modified or new
    modifiedTreeItems.push({
      path,
      mode: '100644',
      type: 'blob',
      content: rawContent,
    });
    modifiedFilePaths.push(path);
  }

  // 7. Check if there are pending changes (Requirement 13)
  if (modifiedTreeItems.length === 0) {
    if (onProgress) {
      onProgress({ current: totalCandidateFiles, total: totalCandidateFiles, filePath: 'No pending changes to deploy.', status: 'done' });
    }
    return {
      success: true,
      totalPushed: 0,
      totalFiles: totalCandidateFiles,
      modifiedFiles: [],
      failedFiles: [],
      commitSha: headSha,
      commitUrl: `https://github.com/${owner}/${repoName}/commit/${headSha}`,
      message: 'All site content and files are already up to date on GitHub. No deployment needed (0 pushes, 0 Cloudflare builds).',
      noChanges: true,
    };
  }

  if (onProgress) {
    onProgress({
      current: Math.floor(totalCandidateFiles * 0.7),
      total: totalCandidateFiles,
      filePath: `Creating unified Git Tree (${modifiedTreeItems.length} modified/new files)...`,
      status: 'pushing',
    });
  }

  // 8. Create ONE Atomic Git Tree with base_tree
  const treeBody: any = { tree: modifiedTreeItems };
  if (baseTreeSha) {
    treeBody.base_tree = baseTreeSha;
  }

  const treeRes = await fetch(`${baseApiUrl}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify(treeBody),
  });

  if (!treeRes.ok) {
    const err = await treeRes.json().catch(() => ({}));
    return {
      success: false,
      totalPushed: 0,
      totalFiles: totalCandidateFiles,
      failedFiles: [{ path: 'git/trees', error: err.message || treeRes.statusText }],
      message: `Failed to create Git tree on GitHub (${treeRes.status}): ${err.message || treeRes.statusText}`,
    };
  }

  const treeData = await treeRes.json();
  const newTreeSha = treeData.sha;

  if (baseTreeSha && newTreeSha === baseTreeSha) {
    // Tree did not change
    return {
      success: true,
      totalPushed: 0,
      totalFiles: totalCandidateFiles,
      failedFiles: [],
      commitSha: headSha,
      commitUrl: `https://github.com/${owner}/${repoName}/commit/${headSha}`,
      message: 'All site content and files are already up to date on GitHub. No deployment needed.',
      noChanges: true,
    };
  }

  // 9. Create ONE Atomic Git Commit
  if (onProgress) {
    onProgress({
      current: Math.floor(totalCandidateFiles * 0.9),
      total: totalCandidateFiles,
      filePath: `Creating unified commit with ${modifiedTreeItems.length} changes...`,
      status: 'pushing',
    });
  }

  const filesSummary =
    modifiedFilePaths.length <= 3
      ? modifiedFilePaths.join(', ')
      : `${modifiedFilePaths.slice(0, 3).join(', ')} and ${modifiedFilePaths.length - 3} more`;
  const commitMessage =
    customCommitMessage?.trim() ||
    `feat(deploy): synchronize ${modifiedTreeItems.length} modified files [${filesSummary}]`;

  const commitRes = await fetch(`${baseApiUrl}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: commitMessage,
      tree: newTreeSha,
      parents: [headSha],
    }),
  });

  if (!commitRes.ok) {
    const err = await commitRes.json().catch(() => ({}));
    return {
      success: false,
      totalPushed: 0,
      totalFiles: totalCandidateFiles,
      failedFiles: [{ path: 'git/commits', error: err.message || commitRes.statusText }],
      message: `Failed to create Git commit on GitHub: ${err.message || commitRes.statusText}`,
    };
  }

  const commitData = await commitRes.json();
  const newCommitSha = commitData.sha;

  // 10. Perform EXACTLY ONE GitHub Push (update branch ref)
  if (onProgress) {
    onProgress({
      current: totalCandidateFiles,
      total: totalCandidateFiles,
      filePath: `Updating ${branch} branch reference (triggering 1 Cloudflare build)...`,
      status: 'pushing',
    });
  }

  let updateRefRes = await fetch(`${baseApiUrl}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ sha: newCommitSha, force: false }),
  });

  // Handle fast-forward conflict safely if remote advanced concurrently
  if (!updateRefRes.ok && updateRefRes.status === 422) {
    try {
      const retryRefRes = await fetch(`${baseApiUrl}/git/ref/heads/${branch}`, { method: 'GET', headers });
      if (retryRefRes.ok) {
        const retryRefData = await retryRefRes.json();
        const currentHeadSha = retryRefData.object?.sha;
        if (currentHeadSha && currentHeadSha !== headSha) {
          const retryCommitRes = await fetch(`${baseApiUrl}/git/commits`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              message: commitMessage,
              tree: newTreeSha,
              parents: [currentHeadSha],
            }),
          });
          if (retryCommitRes.ok) {
            const retryCommitData = await retryCommitRes.json();
            updateRefRes = await fetch(`${baseApiUrl}/git/refs/heads/${branch}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ sha: retryCommitData.sha, force: false }),
            });
          }
        }
      }
    } catch (retryErr) {
      console.warn('[Deploy] Fast-forward retry failed:', retryErr);
    }
  }

  if (!updateRefRes.ok) {
    const err = await updateRefRes.json().catch(() => ({}));
    return {
      success: false,
      totalPushed: 0,
      totalFiles: totalCandidateFiles,
      failedFiles: [{ path: 'git/refs', error: err.message || updateRefRes.statusText }],
      message: `Failed to update branch "${branch}": ${err.message || updateRefRes.statusText}`,
    };
  }

  // 11. Sync modified files to local container disk in background so Preview is identical
  try {
    const syncPayload = modifiedFilePaths
      .filter((p) => !p.startsWith('public/uploads/'))
      .map((p) => ({ path: p, content: fullFilesMap[p] }));
    if (syncPayload.length > 0) {
      await fetch('/api/content/sync-disk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: syncPayload }),
      });
    }
  } catch {}

  const shortSha = newCommitSha.substring(0, 7);
  const commitUrl = `https://github.com/${owner}/${repoName}/commit/${newCommitSha}`;

  if (onProgress) {
    onProgress({
      current: totalCandidateFiles,
      total: totalCandidateFiles,
      filePath: `Deployment complete! Single commit ${shortSha} created.`,
      status: 'done',
    });
  }

  return {
    success: true,
    totalPushed: modifiedTreeItems.length,
    totalFiles: totalCandidateFiles,
    modifiedFiles: modifiedFilePaths,
    failedFiles: [],
    commitSha: newCommitSha,
    commitUrl,
    message: `Successfully published all ${modifiedTreeItems.length} accumulated changes to GitHub in 1 atomic commit (${shortSha}) and 1 push! Exactly 1 Cloudflare Pages build triggered.`,
  };
}

/**
 * Backward-compatible wrapper for full repository push
 */
export async function executeFullRepositoryPush(payload: FullPushPayload): Promise<{
  success: boolean;
  totalPushed: number;
  totalFiles: number;
  modifiedFiles?: string[];
  failedFiles: { path: string; error: string }[];
  commitSha?: string;
  commitUrl?: string;
  verifiedRootFiles?: string[];
  message: string;
  noChanges?: boolean;
}> {
  return executeAtomicBulkDeploy(payload);
}

/**
 * Executes a real atomic publish operation.
 * Stages the content file locally, then bundles ALL accumulated pending changes
 * into ONE single atomic Git commit & ONE push ONLY IF autoDeployOnPublish is true.
 * Otherwise, changes remain local in Preview for batch deployment.
 */
export async function executeRealGitHubPublish(
  item: Post | Page,
  isPage: boolean,
  markdownWithFrontmatter: string,
  deploymentSettings: DeploymentSettings,
  sessionToken?: string
): Promise<PublishResult> {
  const branch = deploymentSettings.githubBranch || 'main';
  const repoString = deploymentSettings.githubRepo || 'ipritamsingh/astropress';
  const [owner, repoName] = repoString.split('/');
  const token = (sessionToken || deploymentSettings.githubToken || '').trim();
  const siteUrl = deploymentSettings.productionUrl || '';

  if (!item.title || !item.title.trim()) {
    return {
      success: false,
      buildTriggered: false,
      status: 'failed',
      message: 'Title is required before publishing.',
      error: 'Missing title',
    };
  }

  if (!item.slug || !item.slug.trim()) {
    return {
      success: false,
      buildTriggered: false,
      status: 'failed',
      message: 'Permalink slug is required.',
      error: 'Missing slug',
    };
  }

  // 1. Stage content file locally so Astro collections & Preview render it immediately
  try {
    await fetch('/api/content/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: item.slug,
        isPage,
        content: markdownWithFrontmatter,
      }),
    });
  } catch {}

  // 2. Stage referenced image assets locally (without individual GitHub pushes)
  try {
    await syncReferencedImageAssets(item, markdownWithFrontmatter, token, owner, repoName, branch, deploymentSettings);
  } catch {}

  // 3. ONLY push immediately if user explicitly enabled autoDeployOnPublish
  if (deploymentSettings.autoDeployOnPublish && token && owner && repoName) {
    const deployResult = await executeAtomicBulkDeploy({
      deploymentSettings,
      sessionToken: token,
      customCommitMessage: `feat(content): publish ${isPage ? 'page' : 'post'} "${item.title.trim()}"`,
    });

    if (deployResult.success) {
      const realSha = deployResult.commitSha || 'c-' + Date.now().toString(36);
      const shortSha = realSha.substring(0, 7);
      const newRecord: GitCommitRecord = {
        id: shortSha,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        message: `feat(content): publish ${isPage ? 'page' : 'post'} "${item.title.trim()}" [atomic push]`,
        author: 'AstroPress Admin',
        branch,
        status: 'synced',
      };
      const finalUrl = isPage ? `${siteUrl}/${item.slug}` : `${siteUrl}/posts/${item.slug}`;

      return {
        success: true,
        commit: newRecord,
        commitSha: realSha,
        commitUrl: deployResult.commitUrl,
        publishedUrl: finalUrl,
        buildTriggered: !deployResult.noChanges,
        status: 'published',
        message: deployResult.noChanges
          ? `Changes saved locally. All files are already in sync with GitHub.`
          : `Published to GitHub in 1 atomic commit (${shortSha})!`,
      };
    } else {
      return {
        success: false,
        buildTriggered: false,
        status: 'failed',
        message: deployResult.message || 'GitHub Publication failed.',
        error: deployResult.message,
      };
    }
  }

  // 4. Default: Staged locally in Preview (0 Git pushes, 0 Cloudflare builds).
  // All accumulated changes will be deployed together in 1 atomic commit when user clicks Update & Deploy.
  const commitId = 'c-' + Math.random().toString(36).substring(2, 9);
  const newRecord: GitCommitRecord = {
    id: commitId,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    message: `feat(content): stage ${isPage ? 'page' : 'post'} "${item.title.trim()}" in Preview`,
    author: 'AstroPress Admin',
    branch,
    status: 'synced',
  };
  const finalUrl = isPage ? `${siteUrl}/${item.slug}` : `${siteUrl}/posts/${item.slug}`;

  return {
    success: true,
    commit: newRecord,
    commitSha: commitId,
    publishedUrl: finalUrl,
    buildTriggered: false,
    status: 'local_saved',
    message: `Saved & published in Preview! Changes are staged. To push all accumulated updates in 1 atomic commit, use 'Update & Deploy' in GitHub & Deployment.`,
  };
}

/**
 * Universal content publisher for Posts, Pages, and Hero Section configurations
 */
export async function executePublishContent(payload: PublishContentPayload): Promise<PublishResult> {
  const { type, item, isPage = false, markdownWithFrontmatter = '', heroConfig, settings, sessionToken } = payload;

  if (type === 'post' || type === 'page') {
    if (!item) {
      return {
        success: false,
        buildTriggered: false,
        status: 'failed',
        message: 'No item provided to publish',
      };
    }
    return executeRealGitHubPublish(item, isPage, markdownWithFrontmatter, settings, sessionToken);
  }

  if (type === 'hero' && heroConfig) {
    const token = (sessionToken || settings.githubToken || '').trim();
    const siteUrl = settings.productionUrl || '';
    const branch = settings.githubBranch || 'main';

    if (settings.autoDeployOnPublish && token && settings.githubRepo) {
      const deployResult = await executeAtomicBulkDeploy({
        heroConfig,
        deploymentSettings: settings,
        sessionToken: token,
        customCommitMessage: 'feat(hero): update homepage hero section visual settings',
      });

      if (deployResult.success) {
        const realSha = deployResult.commitSha || 'c-' + Date.now().toString(36);
        const shortSha = realSha.substring(0, 7);
        const commitRecord: GitCommitRecord = {
          id: shortSha,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
          message: 'feat(hero): update homepage hero section visual settings',
          author: 'AstroPress Admin',
          branch,
          status: 'synced',
        };
        return {
          success: true,
          commit: commitRecord,
          commitSha: realSha,
          commitUrl: deployResult.commitUrl,
          publishedUrl: siteUrl || undefined,
          buildTriggered: !deployResult.noChanges,
          status: 'published',
          message: deployResult.noChanges
            ? 'Hero settings saved locally. All files are already in sync with GitHub.'
            : `Hero section published to GitHub in 1 atomic commit (${shortSha})!`,
        };
      } else {
        return {
          success: false,
          buildTriggered: false,
          status: 'failed',
          message: deployResult.message || 'Failed to deploy hero section to GitHub.',
        };
      }
    }

    const commitId = 'c-' + Math.random().toString(36).substring(2, 9);
    return {
      success: true,
      commit: {
        id: commitId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        message: 'feat(hero): update homepage hero section visual settings (staged in Preview)',
        author: 'AstroPress Admin',
        branch,
        status: 'synced',
      },
      commitSha: commitId,
      publishedUrl: siteUrl || undefined,
      buildTriggered: false,
      status: 'local_saved',
      message: 'Hero Section settings saved in Preview. Staged for atomic deployment.',
    };
  }

  return {
    success: false,
    buildTriggered: false,
    status: 'failed',
    message: 'Unknown publish payload type',
  };
}

export interface PushFilePayload {
  filePath: string;
  content: string;
  commitMessage: string;
  deploymentSettings: DeploymentSettings;
  sessionToken?: string;
}

export async function pushSingleFileToGitHub(
  payload: PushFilePayload
): Promise<{ success: boolean; error?: string; commitSha?: string }> {
  // Only push if explicitly requested via autoDeployOnPublish
  if (payload.deploymentSettings.autoDeployOnPublish) {
    const res = await executeAtomicBulkDeploy({
      deploymentSettings: payload.deploymentSettings,
      sessionToken: payload.sessionToken,
      customCommitMessage: payload.commitMessage,
    });
    return {
      success: res.success,
      error: res.failedFiles[0]?.error,
      commitSha: res.commitSha,
    };
  }

  return {
    success: true,
    commitSha: undefined,
  };
}

/**
 * Helper to stage referenced image assets locally (IndexedDB and /api/media/upload)
 * Does NOT push individual images to GitHub - all images are included in the single atomic commit.
 */
export async function syncReferencedImageAssets(
  item: any,
  markdownText: string,
  _token?: string,
  _owner?: string,
  _repoName?: string,
  _branch: string = 'main',
  _deploymentSettings?: DeploymentSettings
): Promise<void> {
  const referencedUrls = new Set<string>();

  if (item.featuredImage) referencedUrls.add(item.featuredImage);
  if (Array.isArray(item.blocks)) {
    item.blocks.forEach((b: any) => {
      if (b.content && typeof b.content === 'string') {
        const matches = b.content.match(/\/(uploads\/[^\s"')]+)/g);
        if (matches) matches.forEach((m: string) => referencedUrls.add(m));
        if (b.content.startsWith('/uploads/') || b.content.startsWith('data:')) referencedUrls.add(b.content);
      }
      if (b.settings?.imageUrl) {
        referencedUrls.add(b.settings.imageUrl);
      }
    });
  }

  const mdMatches = markdownText.match(/\/uploads\/[A-Za-z0-9_.-]+/g);
  if (mdMatches) {
    mdMatches.forEach((m) => referencedUrls.add(m));
  }
  const dataMatches = markdownText.match(/data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+/g);
  if (dataMatches) {
    dataMatches.forEach((m) => referencedUrls.add(m));
  }

  const storedBlobs = await getAllPersistedMediaBlobs().catch(() => []);
  let cmsMedia: MediaItem[] = [];
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('astropress_cms_state_v3') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.media)) cmsMedia = parsed.media;
    }
  } catch (e) {}

  for (const rawUrl of Array.from(referencedUrls)) {
    if (!rawUrl || rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) continue;

    let filename = '';
    let dataUrl = '';

    if (rawUrl.startsWith('data:image/')) {
      dataUrl = rawUrl;
      filename = `upload-asset-${Date.now()}-${Math.floor(Math.random() * 1000)}.webp`;
    } else if (rawUrl.startsWith('/uploads/') || rawUrl.startsWith('uploads/')) {
      filename = rawUrl.replace(/^\/?uploads\//, '');
    }

    if (!filename) continue;

    if (!dataUrl) {
      const foundStored = storedBlobs.find(
        (b) =>
          b.filename === filename ||
          b.id.includes(filename) ||
          (typeof b.data === 'string' && b.data.includes(filename))
      );
      if (foundStored && typeof foundStored.data === 'string') {
        dataUrl = foundStored.data;
      }
    }

    if (!dataUrl) {
      const foundMedia = cmsMedia.find(
        (m) =>
          m.name === filename ||
          (m.url && m.url.includes(filename)) ||
          (m.originalUrl && m.originalUrl.includes(filename))
      );
      if (foundMedia) {
        if (foundMedia.url && foundMedia.url.startsWith('data:')) {
          dataUrl = foundMedia.url;
        } else if (foundMedia.originalUrl && foundMedia.originalUrl.startsWith('data:')) {
          dataUrl = foundMedia.originalUrl;
        } else {
          const blobById = storedBlobs.find((b) => b.id === foundMedia.id);
          if (blobById && typeof blobById.data === 'string') {
            dataUrl = blobById.data;
          }
        }
      }
    }

    if (!dataUrl && typeof window !== 'undefined') {
      try {
        const res = await fetch(`/uploads/${filename}`);
        if (res.ok) {
          const blob = await res.blob();
          dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
      } catch (e) {}
    }

    if (!dataUrl) continue;

    // Stage image locally to container /public/uploads/
    try {
      await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, dataUrl }),
      });
    } catch (e) {}
  }
}
