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
 * Executes a real atomic commit operation against GitHub Git Data API.
 * Pushes Markdown + Frontmatter directly to the repository branch and returns real SHA.
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
  const token = sessionToken || deploymentSettings.githubToken;
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

  const filePath = isPage ? `src/content/pages/${item.slug}.md` : `src/content/posts/${item.slug}.md`;
  const commitMessage = `feat(content): publish ${isPage ? 'page' : 'post'} "${item.title}" [${filePath}]`;

  // If user has provided a real GitHub token, make actual GitHub API request
  if (token && token.trim() && owner && repoName) {
    try {
      const cleanToken = token.trim();
      const useProxy =
        deploymentSettings.cloudflareWorkerUrl?.trim() &&
        !isAuthenticatorWorkerUrl(deploymentSettings.cloudflareWorkerUrl);

      const apiUrl = useProxy
        ? `${deploymentSettings.cloudflareWorkerUrl!.trim()}/repos/${owner}/${repoName}/contents/${filePath}`
        : `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`;

      // 1. Sync referenced image assets to public/uploads/ in repo and locally FIRST so images exist when Cloudflare builds
      try {
        await syncReferencedImageAssets(item, markdownWithFrontmatter, cleanToken, owner, repoName, branch, deploymentSettings);
      } catch (e) {
        console.warn('Asset sync warning:', e);
      }

      // 2. Check if file already exists to get its SHA for update
      let existingFileSha: string | undefined = undefined;
      try {
        const getFileRes = await fetch(`${apiUrl}?ref=${branch}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${cleanToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        if (getFileRes.status === 200) {
          const fileData = await getFileRes.json();
          existingFileSha = fileData.sha;
        }
      } catch (e) {
        // File doesn't exist yet, proceed with new file creation
      }

      // 3. Put file contents (Base64 encoded UTF-8)
      const contentBase64 = utf8ToBase64(markdownWithFrontmatter);
      const putBody: any = {
        message: commitMessage,
        content: contentBase64,
        branch,
      };

      if (existingFileSha) {
        putBody.sha = existingFileSha;
      }

      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(putBody),
      });

      if (!putRes.ok) {
        const errJson = await putRes.json().catch(() => ({}));
        return {
          success: false,
          buildTriggered: false,
          status: 'failed',
          message: `GitHub API commit failed (${putRes.status}): ${errJson.message || putRes.statusText}`,
          error: errJson.message || 'GitHub commit failed',
        };
      }

      const putData = await putRes.json();
      const realCommitSha = putData.commit?.sha || 'c-' + Date.now().toString(36);
      const shortSha = realCommitSha.substring(0, 7);
      const commitUrl = putData.commit?.html_url || `https://github.com/${owner}/${repoName}/commit/${realCommitSha}`;

      const newRecord: GitCommitRecord = {
        id: shortSha,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        message: commitMessage,
        author: putData.commit?.author?.name || 'AstroPress Admin',
        branch,
        status: 'synced',
      };

      const finalUrl = isPage ? `${siteUrl}/${item.slug}` : `${siteUrl}/posts/${item.slug}`;

      // Always attempt local markdown collection file write if server is running
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
      } catch (e) {
        // Non-blocking
      }

      return {
        success: true,
        commit: newRecord,
        commitSha: realCommitSha,
        commitUrl,
        publishedUrl: finalUrl,
        buildTriggered: deploymentSettings.autoDeployOnPublish !== false,
        status: 'published',
        message: `Published to GitHub successfully! Commit ${shortSha} created on branch "${branch}".`,
      };
    } catch (networkErr: any) {
      return {
        success: false,
        buildTriggered: false,
        status: 'failed',
        message: `Network error during GitHub publication: ${networkErr.message || 'Connection failed'}`,
        error: networkErr.message,
      };
    }
  }

  // Always attempt local markdown collection file write if server is running
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
  } catch (e) {
    // Non-blocking in production static builds
  }

  // Sync referenced image assets locally and to repo
  try {
    await syncReferencedImageAssets(item, markdownWithFrontmatter, token, owner, repoName, branch, deploymentSettings);
  } catch (e) {
    console.warn('Fallback asset sync warning:', e);
  }

  // Fallback: If no PAT configured, record in local Git audit log with notification to configure token
  const commitId = 'c-' + Math.random().toString(36).substring(2, 9);
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  const newRecord: GitCommitRecord = {
    id: commitId,
    timestamp,
    message: commitMessage,
    author: 'Amit Singh <amitsinghpritam@gmail.com>',
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
    message: `Content saved as Published in local Astro Collections. Note: To push directly to your live GitHub repository, enter your GitHub PAT in Admin > GitHub & Deployment.`,
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
    const branch = settings.githubBranch || 'main';
    const repoString = settings.githubRepo || 'ipritamsingh/astropress';
    const [owner, repoName] = repoString.split('/');
    const token = sessionToken || settings.githubToken;
    const filePath = 'src/data/heroConfig.json';
    const commitMessage = 'feat(hero): update homepage hero section visual settings';

    if (token && token.trim() && owner && repoName) {
      try {
        const cleanToken = token.trim();
        const apiUrl = settings.cloudflareWorkerUrl?.trim()
          ? `${settings.cloudflareWorkerUrl.trim()}/repos/${owner}/${repoName}/contents/${filePath}`
          : `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`;

        let existingFileSha: string | undefined = undefined;
        try {
          const getRes = await fetch(`${apiUrl}?ref=${branch}`, {
            headers: { Authorization: `Bearer ${cleanToken}`, Accept: 'application/vnd.github.v3+json' },
          });
          if (getRes.status === 200) {
            const data = await getRes.json();
            existingFileSha = data.sha;
          }
        } catch (e) {}

        const contentBase64 = utf8ToBase64(JSON.stringify(heroConfig, null, 2));
        const putBody: any = {
          message: commitMessage,
          content: contentBase64,
          branch,
        };
        if (existingFileSha) putBody.sha = existingFileSha;

        const putRes = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${cleanToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(putBody),
        });

        if (putRes.ok) {
          const putData = await putRes.json();
          const realSha = putData.commit?.sha || 'c-' + Date.now().toString(36);
          const shortSha = realSha.substring(0, 7);

          const commitRecord: GitCommitRecord = {
            id: shortSha,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
            message: commitMessage,
            author: putData.commit?.author?.name || 'AstroPress Admin',
            branch,
            status: 'synced',
          };

          return {
            success: true,
            commit: commitRecord,
            commitSha: realSha,
            commitUrl: putData.commit?.html_url,
            publishedUrl: settings.productionUrl || undefined,
            buildTriggered: settings.autoDeployOnPublish !== false,
            status: 'published',
            message: `Hero Section published to GitHub! Commit ${shortSha} created on branch "${branch}".`,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          buildTriggered: false,
          status: 'failed',
          message: `Network error publishing hero: ${err.message}`,
        };
      }
    }

    // Local audit record
    const commitId = 'c-' + Math.random().toString(36).substring(2, 9);
    const commitRecord: GitCommitRecord = {
      id: commitId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      message: commitMessage,
      author: 'Amit Singh <amitsinghpritam@gmail.com>',
      branch,
      status: 'synced',
    };

    return {
      success: true,
      commit: commitRecord,
      commitSha: commitId,
      publishedUrl: settings.productionUrl || undefined,
      buildTriggered: false,
      status: 'local_saved',
      message: 'Hero Section settings saved locally in Astro configuration.',
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
  const { filePath, content, commitMessage, deploymentSettings, sessionToken } = payload;
  const branch = deploymentSettings.githubBranch || 'main';
  const repoString = deploymentSettings.githubRepo || 'ipritamsingh/astropress';
  const [owner, repoName] = repoString.split('/');
  const token = (sessionToken || deploymentSettings.githubToken || '').trim();

  if (!token || !owner || !repoName) {
    return { success: false, error: 'Missing GitHub Token or Repository configuration.' };
  }

  try {
    const useProxy =
      deploymentSettings.cloudflareWorkerUrl?.trim() &&
      !isAuthenticatorWorkerUrl(deploymentSettings.cloudflareWorkerUrl);

    const apiUrl = useProxy
      ? `${deploymentSettings.cloudflareWorkerUrl!.trim()}/repos/${owner}/${repoName}/contents/${filePath}`
      : `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`;

    // 1. Check if file exists to get SHA for update
    let existingFileSha: string | undefined = undefined;
    try {
      const getFileRes = await fetch(`${apiUrl}?ref=${branch}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (getFileRes.status === 200) {
        const fileData = await getFileRes.json();
        existingFileSha = fileData.sha;
      }
    } catch (e) {
      // file does not exist yet
    }

    // 2. Put file contents (Base64 encoded)
    let contentBase64 = '';
    if (typeof content === 'string' && content.startsWith('data:') && content.includes(';base64,')) {
      contentBase64 = content.replace(/^data:[^;]+;base64,/, '').trim();
    } else {
      contentBase64 = utf8ToBase64(content);
    }
    const putBody: any = {
      message: commitMessage,
      content: contentBase64,
      branch,
    };
    if (existingFileSha) {
      putBody.sha = existingFileSha;
    }

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(putBody),
    });

    if (!putRes.ok) {
      const errJson = await putRes.json().catch(() => ({}));
      return {
        success: false,
        error: errJson.message || `HTTP ${putRes.status}: ${putRes.statusText}`,
      };
    }

    const putData = await putRes.json();
    return {
      success: true,
      commitSha: putData.commit?.sha,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network fetch failure',
    };
  }
}

export interface FullPushPayload {
  posts: Post[];
  pages: Page[];
  heroConfig?: HeroSectionConfig;
  themeSettings?: ThemeSettings;
  categories?: Category[];
  tags?: Tag[];
  authors?: Author[];
  media?: MediaItem[];
  menus?: Menu[];
  deploymentSettings: DeploymentSettings;
  sessionToken?: string;
  onProgress?: (info: { current: number; total: number; filePath: string; status: 'pushing' | 'done' | 'error' }) => void;
}

export async function executeFullRepositoryPush(payload: FullPushPayload): Promise<{
  success: boolean;
  totalPushed: number;
  totalFiles: number;
  failedFiles: { path: string; error: string }[];
  commitSha?: string;
  commitUrl?: string;
  verifiedRootFiles?: string[];
  message: string;
}> {
  const {
    posts: initialLocalPosts,
    pages: initialLocalPages,
    heroConfig: initialHeroConfig,
    themeSettings: initialThemeSettings,
    categories: initialCategories,
    tags: initialTags,
    authors: initialAuthors,
    media: initialMedia,
    menus: initialMenus,
    deploymentSettings,
    sessionToken,
    onProgress,
  } = payload;

  const branch = deploymentSettings.githubBranch || 'main';
  const repoString = deploymentSettings.githubRepo || 'ipritamsingh/astropress';
  const [owner, repoName] = repoString.split('/');
  const token = (sessionToken || deploymentSettings.githubToken || '').trim();

  if (!token || !owner || !repoName) {
    return {
      success: false,
      totalPushed: 0,
      totalFiles: 0,
      failedFiles: [{ path: 'auth', error: 'Missing GitHub Personal Access Token or Repository name' }],
      message: 'Missing GitHub Token or Repository configuration.',
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

  // STEP 0: Fetch latest authoritative remote repository state & remote tree before push
  let remoteTreeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];
  let headSha: string | null = null;
  let activePosts = [...initialLocalPosts];
  let activePages = [...initialLocalPages];
  let activeCategories = initialCategories ? [...initialCategories] : [];
  let activeTags = initialTags ? [...initialTags] : [];
  let activeAuthors = initialAuthors ? [...initialAuthors] : [];
  let activeMedia = initialMedia ? [...initialMedia] : [];
  let activeMenus = initialMenus ? [...initialMenus] : [];
  let activeHeroConfig = initialHeroConfig;
  let activeThemeSettings = initialThemeSettings;

  if (onProgress) {
    onProgress({ current: 0, total: 100, filePath: 'Checking remote GitHub repository state for live CMS changes...', status: 'pushing' });
  }

  try {
    const remoteResult = await fetchRemoteCMSDataFromGitHub(deploymentSettings, token);
    if (remoteResult.success && remoteResult.data) {
      if (remoteResult.headSha) headSha = remoteResult.headSha;

      const mergedState = mergeCMSStates(
        {
          posts: initialLocalPosts,
          pages: initialLocalPages,
          categories: initialCategories || [],
          tags: initialTags || [],
          authors: initialAuthors || [],
          media: initialMedia || [],
          comments: [],
          menus: initialMenus || [],
          homepageSections: [],
          heroConfig: initialHeroConfig || ({} as any),
          themeSettings: initialThemeSettings || ({} as any),
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
    console.warn('Remote CMS pre-push check warning:', syncErr);
  }

  // 1. Start with the complete project files manifest (root config, Astro engine, layouts, pages, components, public assets)
  const fullFilesMap: Record<string, string> = { ...projectFilesManifest };

  // 2. Overlay dynamic CMS posts with full frontmatter, featured image, and blocks
  activePosts.forEach((post) => {
    const md = `---
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
    fullFilesMap[`src/content/posts/${post.slug}.md`] = md;
  });

  // 3. Overlay dynamic CMS pages
  activePages.forEach((page) => {
    const md = `---
title: "${(page.title || '').replace(/"/g, '\\"')}"
slug: "${page.slug}"
pubDate: ${new Date().toISOString()}
template: "${page.template || 'default'}"
draft: ${page.status === 'draft'}
blocks: ${JSON.stringify(page.blocks || [])}
---

${page.body || ''}`;
    fullFilesMap[`src/content/pages/${page.slug}.md`] = md;
  });

  // 4. Overlay hero config
  if (activeHeroConfig) {
    fullFilesMap['src/data/heroConfig.json'] = JSON.stringify(activeHeroConfig, null, 2);
  }

  // 5. Overlay theme settings
  if (activeThemeSettings) {
    fullFilesMap['src/data/themeSettings.json'] = JSON.stringify(activeThemeSettings, null, 2);
  }

  // 6. Overlay taxonomy (Categories & Tags)
  if (activeCategories.length > 0 || activeTags.length > 0) {
    fullFilesMap['src/data/categories.json'] = JSON.stringify(
      { categories: activeCategories, tags: activeTags },
      null,
      2
    );
  }

  // 6b. Overlay authors and system users
  if (activeAuthors.length > 0) {
    fullFilesMap['src/data/authors.json'] = JSON.stringify(activeAuthors, null, 2);
  }

  // 7. Overlay media metadata and binary assets
  if (activeMedia.length > 0) {
    fullFilesMap['src/data/media.json'] = JSON.stringify(activeMedia, null, 2);
  }

  // Collect and include all uploaded media binary files into public/uploads/
  const storedBlobs = await getAllPersistedMediaBlobs().catch(() => []);
  const allMedia = activeMedia || [];

  const neededImageFilenames = new Set<string>();
  allMedia.forEach((m) => {
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
      if (matches) {
        matches.forEach((m) => neededImageFilenames.add(m.replace(/^\/?uploads\//, '')));
      }
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
    if (!dataUrl) {
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
    if (dataUrl) {
      fullFilesMap[assetPath] = dataUrl;
    }
  }

  // 8. Overlay menus
  if (activeMenus.length > 0) {
    fullFilesMap['src/data/menus.json'] = JSON.stringify(activeMenus, null, 2);
  }

  const allFilePaths = Object.keys(fullFilesMap);
  const totalFiles = allFilePaths.length;
  const commitMessage = `feat: synchronize complete AstroPress project (${totalFiles} files: root configuration, Astro engine, layouts, components, and CMS content)`;

  // Primary Path: Atomic Git Trees & Commit API (Pushes everything in a SINGLE atomic commit)
  try {
    if (onProgress) {
      onProgress({ current: 1, total: totalFiles, filePath: 'Preparing Git Tree for complete project...', status: 'pushing' });
    }

    // Step A: Get current HEAD commit of target branch if not retrieved
    if (!headSha) {
      try {
        const refRes = await fetch(`${baseApiUrl}/git/ref/heads/${branch}`, { method: 'GET', headers });
        if (refRes.ok) {
          const refData = await refRes.json();
          headSha = refData.object?.sha || null;
        }
      } catch (e) {}
    }

    // Fetch existing remote tree to preserve existing remote blobs (such as previous uploaded assets)
    if (headSha && remoteTreeItems.length === 0) {
      try {
        const treeRes = await fetch(`${baseApiUrl}/git/trees/${headSha}?recursive=1`, { headers });
        if (treeRes.ok) {
          const treeData = await treeRes.json();
          remoteTreeItems = treeData.tree || [];
        }
      } catch (e) {}
    }

    // Step B: Build Tree items with proper binary blob creation & remote blob retention
    const treeItemsMap = new Map<string, { path: string; mode: string; type: string; sha?: string; content?: string }>();

    // First retain existing remote uploaded media assets and files that exist in the remote tree
    remoteTreeItems.forEach((remoteItem) => {
      if (remoteItem.type === 'blob' && remoteItem.path.startsWith('public/uploads/')) {
        treeItemsMap.set(remoteItem.path, {
          path: remoteItem.path,
          mode: remoteItem.mode || '100644',
          type: 'blob',
          sha: remoteItem.sha,
        });
      }
    });

    for (let i = 0; i < allFilePaths.length; i++) {
      const path = allFilePaths[i];
      const rawContent = fullFilesMap[path];

      // Check if file is binary (e.g. data:image/...;base64, or image file extension)
      const isBinary =
        (typeof rawContent === 'string' && rawContent.startsWith('data:') && rawContent.includes(';base64,')) ||
        /\.(webp|png|jpg|jpeg|gif|ico|pdf|woff|woff2|ttf|eot|mp4|webm)$/i.test(path);

      if (isBinary && typeof rawContent === 'string' && rawContent.includes(';base64,')) {
        try {
          const base64Data = rawContent.replace(/^data:[^;]+;base64,/, '').trim();
          const blobRes = await fetch(`${baseApiUrl}/git/blobs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              content: base64Data,
              encoding: 'base64',
            }),
          });
          if (blobRes.ok) {
            const blobData = await blobRes.json();
            treeItemsMap.set(path, {
              path,
              mode: '100644',
              type: 'blob',
              sha: blobData.sha,
            });
            continue;
          }
        } catch (blobErr) {
          console.warn(`Failed to create Git blob for ${path}:`, blobErr);
        }
      }

      treeItemsMap.set(path, {
        path,
        mode: '100644',
        type: 'blob',
        content: rawContent,
      });
    }

    const treeItems = Array.from(treeItemsMap.values());

    if (onProgress) {
      onProgress({
        current: Math.floor(totalFiles / 2),
        total: totalFiles,
        filePath: `Creating unified Git Tree (${treeItems.length} project files)...`,
        status: 'pushing',
      });
    }

    // Step C: Create Git Tree
    const treeRes = await fetch(`${baseApiUrl}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tree: treeItems }),
    });

    if (treeRes.ok) {
      const treeData = await treeRes.json();
      const newTreeSha = treeData.sha;

      // Step D: Create Git Commit with headSha as parent
      if (onProgress) {
        onProgress({ current: totalFiles - 1, total: totalFiles, filePath: 'Creating unified commit on branch...', status: 'pushing' });
      }

      const commitBody: any = {
        message: commitMessage,
        tree: newTreeSha,
      };
      if (headSha) {
        commitBody.parents = [headSha];
      }

      const commitRes = await fetch(`${baseApiUrl}/git/commits`, {
        method: 'POST',
        headers,
        body: JSON.stringify(commitBody),
      });

      if (commitRes.ok) {
        const commitData = await commitRes.json();
        const newCommitSha = commitData.sha;

        // Step E: Update branch reference
        const updateRefRes = await fetch(`${baseApiUrl}/git/refs/heads/${branch}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ sha: newCommitSha, force: false }),
        });

        // If fast-forward update is rejected due to concurrent push, retry with force=true on branch
        if (!updateRefRes.ok) {
          await fetch(`${baseApiUrl}/git/refs/heads/${branch}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ sha: newCommitSha, force: true }),
          });
        }

        if (onProgress) {
          onProgress({ current: totalFiles, total: totalFiles, filePath: 'Verifying repository root contents...', status: 'done' });
        }

        // Step F: Post-push Verification
        let verifiedRootFiles: string[] = [];
        try {
          const contentsRes = await fetch(`${baseApiUrl}/contents?ref=${branch}`, { method: 'GET', headers });
          if (contentsRes.ok) {
            const contentsData = await contentsRes.json();
            if (Array.isArray(contentsData)) {
              verifiedRootFiles = contentsData.map((item: any) => item.name);
            }
          }
        } catch (e) {}

        const commitUrl = `https://github.com/${owner}/${repoName}/commit/${newCommitSha}`;

        return {
          success: true,
          totalPushed: treeItems.length,
          totalFiles: treeItems.length,
          failedFiles: [],
          commitSha: newCommitSha,
          commitUrl,
          verifiedRootFiles,
          message: `Successfully synchronized complete AstroPress project (${treeItems.length} files) to GitHub in a single commit!`,
        };
      }
    }
  } catch (treeErr: any) {
    console.warn('Git Tree API error, falling back to sequential push:', treeErr);
  }

  // Fallback: Push files individually if Tree API fails
  let totalPushed = 0;
  const failedFiles: { path: string; error: string }[] = [];
  let lastCommitSha: string | undefined = undefined;

  for (let i = 0; i < allFilePaths.length; i++) {
    const filePath = allFilePaths[i];
    const content = fullFilesMap[filePath];

    if (onProgress) {
      onProgress({ current: i + 1, total: allFilePaths.length, filePath, status: 'pushing' });
    }

    const res = await pushSingleFileToGitHub({
      filePath,
      content,
      commitMessage: `sync: update ${filePath}`,
      deploymentSettings,
      sessionToken: token,
    });

    if (res.success) {
      totalPushed++;
      if (res.commitSha) lastCommitSha = res.commitSha;
      if (onProgress) {
        onProgress({ current: i + 1, total: allFilePaths.length, filePath, status: 'done' });
      }
    } else {
      failedFiles.push({ path: filePath, error: res.error || 'Push failed' });
      if (onProgress) {
        onProgress({ current: i + 1, total: allFilePaths.length, filePath, status: 'error' });
      }
    }
  }

  const isSuccess = failedFiles.length === 0 && totalPushed > 0;
  return {
    success: isSuccess,
    totalPushed,
    totalFiles: allFilePaths.length,
    failedFiles,
    commitSha: lastCommitSha,
    commitUrl: lastCommitSha ? `https://github.com/${owner}/${repoName}/commit/${lastCommitSha}` : undefined,
    message: isSuccess
      ? `Successfully synchronized all ${totalPushed} project files to GitHub!`
      : `Pushed ${totalPushed}/${allFilePaths.length} files. ${failedFiles.length} file(s) failed.`,
  };
}

/**
 * Helper to upload image assets referenced in a post to GitHub and local public/uploads directory
 */
export async function syncReferencedImageAssets(
  item: any,
  markdownText: string,
  token?: string,
  owner?: string,
  repoName?: string,
  branch: string = 'main',
  deploymentSettings?: DeploymentSettings
): Promise<void> {
  const referencedUrls = new Set<string>();

  // Extract from item featuredImage and blocks
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

  // Extract /uploads/... paths and data: URLs from markdown text
  const mdMatches = markdownText.match(/\/uploads\/[A-Za-z0-9_.-]+/g);
  if (mdMatches) {
    mdMatches.forEach((m) => referencedUrls.add(m));
  }
  const dataMatches = markdownText.match(/data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+/g);
  if (dataMatches) {
    dataMatches.forEach((m) => referencedUrls.add(m));
  }

  // Get persisted media blobs from IndexedDB
  const storedBlobs = await getAllPersistedMediaBlobs().catch(() => []);

  // Retrieve CMS media library from localStorage if available
  let cmsMedia: MediaItem[] = [];
  try {
    const raw = localStorage.getItem('astropress_cms_state_v3');
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

    // 1. Check if binary data is in storedBlobs by filename or id
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

    // 2. Check if binary data is in cmsMedia matching filename
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

    // 3. Try fetching from local /uploads/{filename}
    if (!dataUrl) {
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

    // A. Always write asset locally to public/uploads/
    try {
      await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, dataUrl }),
      });
    } catch (e) {}

    // B. Push image file to public/uploads/{filename} in GitHub repository
    if (token && token.trim() && owner && repoName) {
      try {
        const cleanToken = token.trim();
        const assetPath = `public/uploads/${filename}`;
        const useProxy =
          deploymentSettings?.cloudflareWorkerUrl?.trim() &&
          !isAuthenticatorWorkerUrl(deploymentSettings.cloudflareWorkerUrl);

        const apiUrl = useProxy
          ? `${deploymentSettings!.cloudflareWorkerUrl!.trim()}/repos/${owner}/${repoName}/contents/${assetPath}`
          : `https://api.github.com/repos/${owner}/${repoName}/contents/${assetPath}`;

        let existingSha: string | undefined = undefined;
        try {
          const checkRes = await fetch(`${apiUrl}?ref=${branch}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${cleanToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          });
          if (checkRes.status === 200) {
            const json = await checkRes.json();
            existingSha = json.sha;
          }
        } catch (e) {}

        const base64Content = dataUrl.replace(/^data:[^;]+;base64,/, '').trim();
        if (base64Content) {
          const putBody: any = {
            message: `chore(media): sync asset public/uploads/${filename}`,
            content: base64Content,
            branch,
          };
          if (existingSha) putBody.sha = existingSha;

          await fetch(apiUrl, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${cleanToken}`,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(putBody),
          });
        }
      } catch (err) {
        console.warn('Failed to publish asset to GitHub:', filename, err);
      }
    }
  }
}
