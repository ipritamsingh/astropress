import {
  Post,
  Page,
  Category,
  Tag,
  Author,
  MediaItem,
  Menu,
  HeroSectionConfig,
  ThemeSettings,
  DeploymentSettings,
} from '../types/cms';
import { CMSDataState } from './cmsStore';
import { parseMarkdownToBlocks } from '../components/common/GutenbergBlockRenderer';

/**
 * Robust parser for Markdown files with YAML frontmatter
 */
export function parseFrontmatterAndMarkdown(
  rawContent: string,
  fallbackSlug: string,
  isPage: boolean = false
): Post | Page {
  const normalized = rawContent.replace(/\r\n/g, '\n');
  const frontmatterMatch = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  let fmText = '';
  let body = normalized;

  if (frontmatterMatch) {
    fmText = frontmatterMatch[1];
    body = frontmatterMatch[2].trim();
  }

  const getFmField = (key: string): string => {
    // Match key: "value" or key: value
    const regex = new RegExp(`^${key}:\\s*(?:"([^"]*)"|'([^']*)'|([^\\n]+))$`, 'm');
    const match = fmText.match(regex);
    if (!match) return '';
    return (match[1] ?? match[2] ?? match[3] ?? '').trim();
  };

  const getFmBool = (key: string, defaultVal: boolean = false): boolean => {
    const val = getFmField(key).toLowerCase();
    if (val === 'true') return true;
    if (val === 'false') return false;
    return defaultVal;
  };

  const getFmArray = (key: string): string[] => {
    const lineRegex = new RegExp(`^${key}:\\s*\\[(.*)\\]$`, 'm');
    const match = fmText.match(lineRegex);
    if (match) {
      return match[1]
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    return [];
  };

  const getFmJson = <T>(key: string, defaultVal: T): T => {
    const lineRegex = new RegExp(`^${key}:\\s*([{\\[][\\s\\S]*?[}\\]])$`, 'm');
    const match = fmText.match(lineRegex);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        return defaultVal;
      }
    }
    return defaultVal;
  };

  const slug = getFmField('slug') || fallbackSlug.replace(/\.md$/, '');
  const title = getFmField('title') || slug.replace(/-/g, ' ');
  const pubDate = getFmField('pubDate') || new Date().toISOString();
  const updatedDate = getFmField('updatedDate') || pubDate;
  const statusRaw = getFmField('status').toLowerCase();
  const isDraft = getFmBool('draft', false);
  const status: Post['status'] =
    statusRaw === 'published' || statusRaw === 'draft' || statusRaw === 'archived'
      ? (statusRaw as any)
      : isDraft
      ? 'draft'
      : 'published';

  const author = getFmField('author') || 'Amit Singh';
  const category = getFmField('category') || 'General';
  const tags = getFmArray('tags');
  const featuredImage = getFmField('featuredImage');
  const excerpt = getFmField('excerpt') || (body ? body.substring(0, 160).replace(/[#*`_]/g, '') : '');
  const template = getFmField('template') || 'standard';
  const readingTime = parseInt(getFmField('readingTime'), 10) || Math.max(1, Math.ceil(body.split(/\s+/).length / 200));

  const rawBlocks = getFmJson<any[]>('blocks', []);
  const blocks = rawBlocks.length > 0 ? rawBlocks : parseMarkdownToBlocks(body);
  const seo = {
    metaTitle: getFmField('metaTitle') || title,
    metaDescription: getFmField('metaDescription') || excerpt,
    focusKeyword: getFmField('focusKeyword'),
    robotsIndex: getFmBool('robotsIndex', true),
    robotsFollow: getFmBool('robotsFollow', true),
  };

  if (isPage) {
    const page: Page = {
      id: `page-${slug}`,
      title,
      slug,
      status,
      template: (template as Page['template']) || 'default',
      featuredImage: featuredImage || undefined,
      blocks,
      body,
      seo,
    };
    return page;
  }

  const post: Post = {
    id: `post-${slug}`,
    title,
    slug,
    pubDate,
    updatedDate,
    status,
    author,
    category,
    tags,
    featuredImage,
    excerpt,
    readingTime,
    template: (template as Post['template']) || 'standard',
    blocks,
    body,
    seo,
  };

  return post;
}

/**
 * Fetches authoritative remote CMS data from GitHub repository
 */
export async function fetchRemoteCMSDataFromGitHub(
  settings: DeploymentSettings,
  sessionToken?: string
): Promise<{
  success: boolean;
  data?: Partial<CMSDataState>;
  rawFiles?: Array<{ path: string; content: string }>;
  remoteTreeSha?: string;
  headSha?: string;
  error?: string;
}> {
  const branch = settings.githubBranch || 'main';
  const repoString = settings.githubRepo || 'ipritamsingh/astropress';
  const [owner, repoName] = repoString.split('/');
  const token = (sessionToken || settings.githubToken || '').trim();

  if (!owner || !repoName) {
    return { success: false, error: 'GitHub repository is not configured.' };
  }

  const useProxy =
    settings.cloudflareWorkerUrl?.trim() &&
    !settings.cloudflareWorkerUrl.includes('sveltia-authenticator') &&
    !settings.cloudflareWorkerUrl.includes('authenticator.workers.dev');

  const baseApiUrl = useProxy
    ? `${settings.cloudflareWorkerUrl!.trim()}/repos/${owner}/${repoName}`
    : `https://api.github.com/repos/${owner}/${repoName}`;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    // 1. Get HEAD commit for branch
    const refRes = await fetch(`${baseApiUrl}/git/ref/heads/${branch}`, { headers });
    if (!refRes.ok) {
      return { success: false, error: `Failed to fetch branch "${branch}" (HTTP ${refRes.status})` };
    }
    const refData = await refRes.json();
    const headSha = refData.object?.sha;
    if (!headSha) {
      return { success: false, error: 'No HEAD commit found on branch' };
    }

    // 2. Get full recursive tree for HEAD commit
    const treeRes = await fetch(`${baseApiUrl}/git/trees/${headSha}?recursive=1`, { headers });
    if (!treeRes.ok) {
      return { success: false, error: `Failed to fetch remote Git tree (HTTP ${treeRes.status})` };
    }
    const treeData = await treeRes.json();
    const treeItems: Array<{ path: string; mode: string; type: string; sha: string; size?: number; url?: string }> =
      treeData.tree || [];

    const fetchedPosts: Post[] = [];
    const fetchedPages: Page[] = [];
    const rawFiles: Array<{ path: string; content: string }> = [];
    let fetchedCategories: Category[] | undefined = undefined;
    let fetchedTags: Tag[] | undefined = undefined;
    let fetchedAuthors: Author[] | undefined = undefined;
    let fetchedMedia: MediaItem[] | undefined = undefined;
    let fetchedMenus: Menu[] | undefined = undefined;
    let fetchedHeroConfig: HeroSectionConfig | undefined = undefined;
    let fetchedThemeSettings: ThemeSettings | undefined = undefined;

    // Helper to fetch blob content
    const fetchBlobText = async (itemPath: string, blobSha: string): Promise<string> => {
      try {
        const rawRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repoName}/${headSha}/${itemPath}`);
        if (rawRes.ok) {
          return await rawRes.text();
        }
      } catch (e) {}

      const blobRes = await fetch(`${baseApiUrl}/git/blobs/${blobSha}`, { headers });
      if (!blobRes.ok) return '';
      const bData = await blobRes.json();
      if (bData.encoding === 'base64' && bData.content) {
        return decodeURIComponent(
          atob(bData.content.replace(/\s/g, ''))
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
      }
      return bData.content || '';
    };

    // Filter relevant files
    for (const item of treeItems) {
      if (item.type !== 'blob') continue;

      if (item.path.startsWith('src/content/posts/') && item.path.endsWith('.md')) {
        const text = await fetchBlobText(item.path, item.sha);
        if (text) {
          rawFiles.push({ path: item.path, content: text });
          const filename = item.path.replace('src/content/posts/', '');
          const slug = filename.replace(/\.md$/, '');
          const post = parseFrontmatterAndMarkdown(text, slug, false) as Post;
          fetchedPosts.push(post);
        }
      } else if (item.path.startsWith('src/content/pages/') && item.path.endsWith('.md')) {
        const text = await fetchBlobText(item.path, item.sha);
        if (text) {
          rawFiles.push({ path: item.path, content: text });
          const filename = item.path.replace('src/content/pages/', '');
          const slug = filename.replace(/\.md$/, '');
          const page = parseFrontmatterAndMarkdown(text, slug, true) as Page;
          fetchedPages.push(page);
        }
      } else if (item.path === 'src/data/categories.json') {
        const text = await fetchBlobText(item.path, item.sha);
        if (text) {
          rawFiles.push({ path: item.path, content: text });
          try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed.categories)) fetchedCategories = parsed.categories;
            if (Array.isArray(parsed.tags)) fetchedTags = parsed.tags;
          } catch (e) {}
        }
      } else if (item.path === 'src/data/authors.json') {
        const text = await fetchBlobText(item.path, item.sha);
        if (text) {
          rawFiles.push({ path: item.path, content: text });
          try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) fetchedAuthors = parsed;
          } catch (e) {}
        }
      } else if (item.path === 'src/data/menus.json') {
        const text = await fetchBlobText(item.path, item.sha);
        if (text) {
          rawFiles.push({ path: item.path, content: text });
          try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) fetchedMenus = parsed;
          } catch (e) {}
        }
      } else if (item.path === 'src/data/heroConfig.json') {
        const text = await fetchBlobText(item.path, item.sha);
        if (text) {
          rawFiles.push({ path: item.path, content: text });
          try {
            fetchedHeroConfig = JSON.parse(text);
          } catch (e) {}
        }
      } else if (item.path === 'src/data/themeSettings.json') {
        const text = await fetchBlobText(item.path, item.sha);
        if (text) {
          rawFiles.push({ path: item.path, content: text });
          try {
            fetchedThemeSettings = JSON.parse(text);
          } catch (e) {}
        }
      } else if (item.path === 'src/data/media.json') {
        const text = await fetchBlobText(item.path, item.sha);
        if (text) {
          rawFiles.push({ path: item.path, content: text });
          try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) fetchedMedia = parsed;
          } catch (e) {}
        }
      }
    }

    return {
      success: true,
      headSha,
      remoteTreeSha: treeData.sha,
      rawFiles,
      data: {
        posts: fetchedPosts.length > 0 ? fetchedPosts : undefined,
        pages: fetchedPages.length > 0 ? fetchedPages : undefined,
        categories: fetchedCategories,
        tags: fetchedTags,
        authors: fetchedAuthors,
        media: fetchedMedia,
        menus: fetchedMenus,
        heroConfig: fetchedHeroConfig,
        themeSettings: fetchedThemeSettings,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to fetch remote CMS state',
    };
  }
}

function normalizePostTitleKey(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/\b(update|check|new|draft|copy|vheck)\b/gi, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

/**
 * Merges local CMS data state with authoritative remote/disk CMS state
 * Ensures remote changes made on LIVE Admin or GitHub are NEVER overwritten by stale local snapshots
 */
export function mergeCMSStates(localState: CMSDataState, remoteState: Partial<CMSDataState>): CMSDataState {
  if (!remoteState) return localState;

  // 1. Merge Posts
  let mergedPosts = [...localState.posts];
  if (remoteState.posts && remoteState.posts.length > 0) {
    const postMap = new Map<string, Post>();

    // Start with remote authoritative posts, deduplicating any duplicate remote files by normalized title
    remoteState.posts.forEach((rp) => {
      const rpNormKey = normalizePostTitleKey(rp.title);
      const existingRemoteKey = Array.from(postMap.entries()).find(([k, p]) => {
        if (k === rp.slug || p.slug === rp.slug) return true;
        if (rpNormKey && rpNormKey.length >= 8) {
          return normalizePostTitleKey(p.title) === rpNormKey;
        }
        return false;
      });

      if (existingRemoteKey) {
        // Keep the more recent or preferred entry and consolidate duplicate slug
        const existing = existingRemoteKey[1];
        if (existing.status === 'trash') {
          const preferred = {
            ...rp,
            ...existing,
            status: 'trash' as const,
            originalStatus: existing.originalStatus || rp.status,
            deletedAt: existing.deletedAt,
          };
          postMap.delete(existingRemoteKey[0]);
          if (existing.slug !== preferred.slug) postMap.delete(existing.slug);
          postMap.set(preferred.slug, preferred);
        } else {
          const isRpNewer = new Date(rp.pubDate || 0).getTime() >= new Date(existing.pubDate || 0).getTime();
          const preferred = isRpNewer ? { ...existing, ...rp } : { ...rp, ...existing };
          postMap.delete(existingRemoteKey[0]);
          if (existing.slug !== preferred.slug) postMap.delete(existing.slug);
          postMap.set(preferred.slug, preferred);
        }
      } else {
        postMap.set(rp.slug, rp);
      }
    });

    // Merge local posts
    localState.posts.forEach((lp) => {
      const lpNormKey = normalizePostTitleKey(lp.title);
      const existingKey = Array.from(postMap.entries()).find(
        ([key, post]) =>
          key === lp.slug ||
          post.slug === lp.slug ||
          (lp.id && (post.id === lp.id || post.id === `post-${lp.slug}` || lp.id === `post-${post.slug}`)) ||
          (lp.originalSlug && (post.slug === lp.originalSlug || key === lp.originalSlug || post.id === `post-${lp.originalSlug}`)) ||
          (lpNormKey && lpNormKey.length >= 8 && normalizePostTitleKey(post.title) === lpNormKey)
      );

      if (!existingKey) {
        // Local newly drafted or created post that hasn't been published to remote yet
        postMap.set(lp.slug, lp);
      } else {
        // If slug was renamed, delete old slug entry to prevent duplicate posts
        if (existingKey[0] !== lp.slug) {
          postMap.delete(existingKey[0]);
        }
        if (existingKey[1].slug !== lp.slug) {
          postMap.delete(existingKey[1].slug);
        }
        // Local updated content takes priority during active editing session, preserving trash if trashed
        const existingPost = existingKey[1];
        if (existingPost.status === 'trash' || lp.status === 'trash') {
          const trashedPost = lp.status === 'trash' ? lp : existingPost;
          postMap.set(lp.slug, {
            ...existingKey[1],
            ...lp,
            ...trashedPost,
            status: 'trash' as const,
            originalStatus: trashedPost.originalStatus || lp.status || existingKey[1].status,
            deletedAt: trashedPost.deletedAt || new Date().toISOString(),
            id: existingKey[1].id || lp.id,
          });
        } else {
          postMap.set(lp.slug, { ...existingKey[1], ...lp, id: existingKey[1].id || lp.id });
        }
      }
    });

    mergedPosts = Array.from(postMap.values());
  }

  // 2. Merge Pages
  let mergedPages = [...localState.pages];
  if (remoteState.pages && remoteState.pages.length > 0) {
    const pageMap = new Map<string, Page>();
    remoteState.pages.forEach((rp) => pageMap.set(rp.slug, rp));
    localState.pages.forEach((lp) => {
      const existingKey = Array.from(pageMap.entries()).find(
        ([key, page]) =>
          key === lp.slug ||
          page.slug === lp.slug ||
          (lp.id && (page.id === lp.id || page.id === `page-${lp.slug}` || lp.id === `page-${page.slug}`)) ||
          (lp.originalSlug && (page.slug === lp.originalSlug || key === lp.originalSlug || page.id === `page-${lp.originalSlug}`))
      );

      if (!existingKey) {
        pageMap.set(lp.slug, lp);
      } else {
        if (existingKey[0] !== lp.slug) {
          pageMap.delete(existingKey[0]);
        }
        if (existingKey[1].slug !== lp.slug) {
          pageMap.delete(existingKey[1].slug);
        }
        pageMap.set(lp.slug, { ...existingKey[1], ...lp, id: existingKey[1].id || lp.id });
      }
    });
    mergedPages = Array.from(pageMap.values());
  }

  // 3. Merge Categories
  let mergedCategories = [...localState.categories];
  if (remoteState.categories && remoteState.categories.length > 0) {
    const catMap = new Map<string, Category>();
    localState.categories.forEach((c) => catMap.set(c.slug || c.id, c));
    remoteState.categories.forEach((c) => catMap.set(c.slug || c.id, c));
    mergedCategories = Array.from(catMap.values());
  }

  // 4. Merge Tags
  let mergedTags = [...localState.tags];
  if (remoteState.tags && remoteState.tags.length > 0) {
    const tagMap = new Map<string, Tag>();
    localState.tags.forEach((t) => tagMap.set(t.slug || t.id, t));
    remoteState.tags.forEach((t) => tagMap.set(t.slug || t.id, t));
    mergedTags = Array.from(tagMap.values());
  }

  // 5. Merge Authors
  let mergedAuthors = [...localState.authors];
  if (remoteState.authors && remoteState.authors.length > 0) {
    const authorMap = new Map<string, Author>();
    localState.authors.forEach((a) => authorMap.set(a.id || a.email || a.name, a));
    remoteState.authors.forEach((a) => authorMap.set(a.id || a.email || a.name, a));
    mergedAuthors = Array.from(authorMap.values());
  }

  // 6. Merge Media
  let mergedMedia = [...localState.media];
  if (remoteState.media && remoteState.media.length > 0) {
    const mediaMap = new Map<string, MediaItem>();
    localState.media.forEach((m) => mediaMap.set(m.name || m.id, m));
    remoteState.media.forEach((m) => mediaMap.set(m.name || m.id, m));
    mergedMedia = Array.from(mediaMap.values());
  }

  // 7. Merge Menus
  let mergedMenus = remoteState.menus && remoteState.menus.length > 0 ? remoteState.menus : localState.menus;

  // 8. Merge HeroConfig and ThemeSettings
  const mergedHeroConfig = {
    ...remoteState.heroConfig,
    ...localState.heroConfig,
  };
  const localSocialLinks = localState.themeSettings?.footer?.socialLinks;
  const remoteSocialLinks = remoteState.themeSettings?.footer?.socialLinks;
  const mergedSocialLinks =
    Array.isArray(localSocialLinks) && localSocialLinks.length > 0
      ? localSocialLinks
      : Array.isArray(remoteSocialLinks)
      ? remoteSocialLinks
      : [];

  const localLegalLinks = localState.themeSettings?.footer?.legalLinks;
  const remoteLegalLinks = remoteState.themeSettings?.footer?.legalLinks;
  const mergedLegalLinks =
    Array.isArray(localLegalLinks) && localLegalLinks.length > 0
      ? localLegalLinks
      : Array.isArray(remoteLegalLinks)
      ? remoteLegalLinks
      : [];

  const mergedThemeSettings = remoteState.themeSettings
    ? {
        ...remoteState.themeSettings,
        ...localState.themeSettings,
        header: { ...remoteState.themeSettings.header, ...localState.themeSettings.header },
        footer: {
          ...remoteState.themeSettings.footer,
          ...localState.themeSettings.footer,
          socialLinks: mergedSocialLinks,
          legalLinks: mergedLegalLinks,
        },
      }
    : localState.themeSettings;

  return {
    ...localState,
    posts: mergedPosts,
    pages: mergedPages,
    categories: mergedCategories,
    tags: mergedTags,
    authors: mergedAuthors,
    media: mergedMedia,
    menus: mergedMenus,
    heroConfig: mergedHeroConfig,
    themeSettings: mergedThemeSettings,
  };
}
