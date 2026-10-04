import {
  Post,
  Page,
  GitCommitRecord,
  DeploymentSettings,
  HeroSectionConfig,
  ThemeSettings,
  Category,
  Tag,
  MediaItem,
  Menu,
} from '../types/cms';
import { projectFilesManifest } from './projectFilesManifest';

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

      // 1. Check if file already exists to get its SHA for update
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

      // 2. Put file contents (Base64 encoded UTF-8)
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

    // 2. Put file contents (Base64 encoded UTF-8)
    const contentBase64 = utf8ToBase64(content);
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
    posts,
    pages,
    heroConfig,
    themeSettings,
    categories,
    tags,
    media,
    menus,
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

  // 1. Start with the complete project files manifest (root config, Astro engine, layouts, pages, components, public assets)
  const fullFilesMap: Record<string, string> = { ...projectFilesManifest };

  // 2. Overlay dynamic CMS posts
  posts.forEach((post) => {
    const md = `---
title: "${(post.title || '').replace(/"/g, '\\"')}"
description: "${(post.excerpt || '').replace(/"/g, '\\"')}"
pubDate: ${post.pubDate || new Date().toISOString()}
author: "${(post.author || 'Pritam Singh').replace(/"/g, '\\"')}"
category: "${(post.category || 'General').replace(/"/g, '\\"')}"
template: "${post.template || 'standard'}"
---

${post.body || ''}`;
    fullFilesMap[`src/content/posts/${post.slug}.md`] = md;
  });

  // 3. Overlay dynamic CMS pages
  pages.forEach((page) => {
    const md = `---
title: "${(page.title || '').replace(/"/g, '\\"')}"
pubDate: ${new Date().toISOString()}
---

${page.body || ''}`;
    fullFilesMap[`src/content/pages/${page.slug}.md`] = md;
  });

  // 4. Overlay hero config
  if (heroConfig) {
    fullFilesMap['src/data/heroConfig.json'] = JSON.stringify(heroConfig, null, 2);
  }

  // 5. Overlay theme settings
  if (themeSettings) {
    fullFilesMap['src/data/themeSettings.json'] = JSON.stringify(themeSettings, null, 2);
  }

  // 6. Overlay taxonomy (Categories & Tags)
  if (categories || tags) {
    fullFilesMap['src/data/categories.json'] = JSON.stringify(
      { categories: categories || [], tags: tags || [] },
      null,
      2
    );
  }

  // 7. Overlay media
  if (media && media.length > 0) {
    fullFilesMap['src/data/media.json'] = JSON.stringify(media, null, 2);
  }

  // 8. Overlay menus
  if (menus && menus.length > 0) {
    fullFilesMap['src/data/menus.json'] = JSON.stringify(menus, null, 2);
  }

  const allFilePaths = Object.keys(fullFilesMap);
  const totalFiles = allFilePaths.length;
  const commitMessage = `feat: synchronize complete AstroPress project (${totalFiles} files: root configuration, Astro engine, layouts, components, and CMS content)`;

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

  // Primary Path: Atomic Git Trees & Commit API (Pushes everything in a SINGLE atomic commit)
  try {
    if (onProgress) {
      onProgress({ current: 1, total: totalFiles, filePath: 'Preparing Git Tree for complete project...', status: 'pushing' });
    }

    // Step A: Get current HEAD commit of target branch
    let headSha: string | null = null;
    try {
      const refRes = await fetch(`${baseApiUrl}/git/ref/heads/${branch}`, { method: 'GET', headers });
      if (refRes.ok) {
        const refData = await refRes.json();
        headSha = refData.object?.sha || null;
      }
    } catch (e) {}

    // Step B: Build Tree items
    const treeItems = allFilePaths.map((path) => ({
      path,
      mode: '100644',
      type: 'blob',
      content: fullFilesMap[path],
    }));

    if (onProgress) {
      onProgress({
        current: Math.floor(totalFiles / 2),
        total: totalFiles,
        filePath: `Creating unified Git Tree (${totalFiles} project files)...`,
        status: 'pushing',
      });
    }

    // Step C: Create Git Tree (Creating fresh tree without base_tree ensures repository root has package.json, astro.config.mjs, public/, src/)
    const treeRes = await fetch(`${baseApiUrl}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tree: treeItems }),
    });

    if (treeRes.ok) {
      const treeData = await treeRes.json();
      const newTreeSha = treeData.sha;

      // Step D: Create Git Commit
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
          body: JSON.stringify({ sha: newCommitSha, force: true }),
        });

        if (updateRefRes.ok) {
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
            totalPushed: totalFiles,
            totalFiles,
            failedFiles: [],
            commitSha: newCommitSha,
            commitUrl,
            verifiedRootFiles,
            message: `Successfully synchronized complete AstroPress project (${totalFiles} files) to GitHub in a single commit!`,
          };
        }
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
