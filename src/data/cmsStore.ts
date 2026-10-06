import { useState, useEffect } from 'react';
import {
  Post,
  Page,
  Category,
  Tag,
  Author,
  MediaItem,
  Comment,
  Menu,
  HomepageSection,
  ThemeSettings,
  DeploymentSettings,
  GitCommitRecord,
  TemplateConfig,
  SiteSettings,
  HeroSectionConfig,
} from '../types/cms';
import {
  initialPosts,
  initialPages,
  initialCategories,
  initialTags,
  initialAuthors,
  initialMedia,
  initialComments,
  initialMenus,
  initialHomepageSections,
  initialThemeSettings,
  initialDeploymentSettings,
  initialCommitHistory,
  initialTemplates,
  initialSiteSettings,
  initialHeroConfig,
} from './initialData';
import {
  fetchRemoteCMSDataFromGitHub,
  mergeCMSStates,
  parseFrontmatterAndMarkdown,
} from './contentSyncService';

export interface CMSDataState {
  posts: Post[];
  pages: Page[];
  categories: Category[];
  tags: Tag[];
  authors: Author[];
  media: MediaItem[];
  comments: Comment[];
  menus: Menu[];
  homepageSections: HomepageSection[];
  heroConfig: HeroSectionConfig;
  themeSettings: ThemeSettings;
  templates: TemplateConfig[];
  siteSettings: SiteSettings;
  deploymentSettings: DeploymentSettings;
  commitHistory: GitCommitRecord[];
}

const STORAGE_KEY = 'astropress_cms_state_v3';
const UPDATE_EVENT = 'astropress_state_updated';

function loadStoredData(): CMSDataState {
  if (typeof window === 'undefined') {
    return {
      posts: initialPosts,
      pages: initialPages,
      categories: initialCategories,
      tags: initialTags,
      authors: initialAuthors,
      media: initialMedia,
      comments: initialComments,
      menus: initialMenus,
      homepageSections: initialHomepageSections,
      heroConfig: initialHeroConfig,
      themeSettings: initialThemeSettings,
      templates: initialTemplates,
      siteSettings: initialSiteSettings,
      deploymentSettings: initialDeploymentSettings,
      commitHistory: initialCommitHistory,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: CMSDataState = {
        posts: initialPosts,
        pages: initialPages,
        categories: initialCategories,
        tags: initialTags,
        authors: initialAuthors,
        media: initialMedia,
        comments: initialComments,
        menus: initialMenus,
        homepageSections: initialHomepageSections,
        heroConfig: initialHeroConfig,
        themeSettings: initialThemeSettings,
        templates: initialTemplates,
        siteSettings: initialSiteSettings,
        deploymentSettings: initialDeploymentSettings,
        commitHistory: initialCommitHistory,
      };
      saveStoredData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    const serverPosts: Post[] = typeof window !== 'undefined' ? (window as any).__ASTROPRESS_SERVER_POSTS__ || [] : [];
    const serverPost: Post = typeof window !== 'undefined' ? (window as any).__ASTROPRESS_INITIAL_POST__ : undefined;
    if (serverPost && !serverPosts.some((sp) => sp.slug === serverPost.slug)) {
      serverPosts.push(serverPost);
    }

    let loadedPosts = parsed.posts || initialPosts;
    if (serverPosts.length > 0) {
      const postMap = new Map<string, Post>();
      loadedPosts.forEach((p: Post) => postMap.set(p.slug, p));
      serverPosts.forEach((sp: Post) => {
        const existing = postMap.get(sp.slug);
        if (!existing) {
          postMap.set(sp.slug, sp);
        } else if (existing.status !== 'published' && sp.status === 'published') {
          postMap.set(sp.slug, { ...existing, ...sp, status: 'published' });
        }
      });
      loadedPosts = Array.from(postMap.values());
    }

    const rawSiteSettings = parsed.siteSettings || {};
    const loadedSiteSettings: SiteSettings = {
      ...initialSiteSettings,
      ...rawSiteSettings,
      indexingSettings: {
        ...initialSiteSettings.indexingSettings,
        ...(rawSiteSettings.indexingSettings || {}),
      },
      newsletterSettings: {
        ...initialSiteSettings.newsletterSettings,
        ...(rawSiteSettings.newsletterSettings || {}),
      },
      communityCtaEnabled:
        rawSiteSettings.communityCtaEnabled !== undefined
          ? rawSiteSettings.communityCtaEnabled
          : initialSiteSettings.communityCtaEnabled,
      communityCtaTitle:
        rawSiteSettings.communityCtaTitle || initialSiteSettings.communityCtaTitle,
      communityCtaSubtitle:
        rawSiteSettings.communityCtaSubtitle || initialSiteSettings.communityCtaSubtitle,
      communityLinks:
        Array.isArray(rawSiteSettings.communityLinks)
          ? rawSiteSettings.communityLinks
          : initialSiteSettings.communityLinks,
    };

    return {
      posts: loadedPosts,
      pages: parsed.pages || initialPages,
      categories: parsed.categories || initialCategories,
      tags: parsed.tags || initialTags,
      authors: parsed.authors || initialAuthors,
      media: parsed.media || initialMedia,
      comments: parsed.comments || initialComments,
      menus: parsed.menus || initialMenus,
      homepageSections: parsed.homepageSections || initialHomepageSections,
      heroConfig: parsed.heroConfig || initialHeroConfig,
      themeSettings: parsed.themeSettings || initialThemeSettings,
      templates: parsed.templates || initialTemplates,
      siteSettings: loadedSiteSettings,
      deploymentSettings: parsed.deploymentSettings || initialDeploymentSettings,
      commitHistory: parsed.commitHistory || initialCommitHistory,
    };
  } catch (err) {
    console.error('Failed to parse CMS storage', err);
    return {
      posts: initialPosts,
      pages: initialPages,
      categories: initialCategories,
      tags: initialTags,
      authors: initialAuthors,
      media: initialMedia,
      comments: initialComments,
      menus: initialMenus,
      homepageSections: initialHomepageSections,
      heroConfig: initialHeroConfig,
      themeSettings: initialThemeSettings,
      templates: initialTemplates,
      siteSettings: initialSiteSettings,
      deploymentSettings: initialDeploymentSettings,
      commitHistory: initialCommitHistory,
    };
  }
}

function sanitizeDataForLocalStorage(data: CMSDataState): CMSDataState {
  // Deep clone to avoid mutating live in-memory state
  const cleanData: CMSDataState = JSON.parse(JSON.stringify(data));

  // Build a lookup map of media item URLs/names
  const mediaByUrl = new Map<string, string>();
  cleanData.media.forEach((m) => {
    if (m.name) {
      if (m.url) mediaByUrl.set(m.url, `/uploads/${m.name}`);
      if (m.originalUrl) mediaByUrl.set(m.originalUrl, `/uploads/${m.name}`);
    }
  });

  // Sanitize media items: remove any large dataUrls from url or originalUrl to prevent QuotaExceededError
  cleanData.media = cleanData.media.map((m) => {
    let url = m.url;
    let originalUrl = m.originalUrl;
    if (url && url.startsWith('data:')) {
      url = `/uploads/${m.name}`;
    }
    if (originalUrl && originalUrl.startsWith('data:')) {
      originalUrl = `/uploads/${m.name}`;
    }
    return { ...m, url, originalUrl };
  });

  // Sanitize posts with huge dataUrls in blocks or featuredImage
  cleanData.posts = cleanData.posts.map((p) => {
    let cleanFeatured = p.featuredImage;
    if (cleanFeatured && cleanFeatured.startsWith('data:')) {
      const foundUrl = mediaByUrl.get(cleanFeatured);
      if (foundUrl) {
        cleanFeatured = foundUrl;
      }
    }
    const cleanBlocks = (p.blocks || []).map((b) => {
      let cleanContent = b.content;
      const cleanSettings = { ...b.settings };

      if (cleanContent && cleanContent.startsWith('data:')) {
        const foundUrl = mediaByUrl.get(cleanContent);
        if (foundUrl) {
          cleanContent = foundUrl;
        } else if (cleanSettings.imageUrl && !cleanSettings.imageUrl.startsWith('data:')) {
          cleanContent = cleanSettings.imageUrl;
        }
      }

      if (cleanSettings.imageUrl && cleanSettings.imageUrl.startsWith('data:')) {
        const foundUrl = mediaByUrl.get(cleanSettings.imageUrl);
        if (foundUrl) {
          cleanSettings.imageUrl = foundUrl;
        } else if (cleanContent && !cleanContent.startsWith('data:')) {
          cleanSettings.imageUrl = cleanContent;
        }
      }
      return { ...b, content: cleanContent, settings: cleanSettings };
    });
    return { ...p, featuredImage: cleanFeatured, blocks: cleanBlocks };
  });

  return cleanData;
}

export function saveStoredData(data: CMSDataState) {
  if (typeof window === 'undefined') return;
  try {
    const clean = sanitizeDataForLocalStorage(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch (err) {
    console.warn('Failed to save full CMS state to localStorage, retrying with fallback', err);
    try {
      // Emergency fallback if storage is heavily constrained
      const minimalData = { ...data, media: data.media.slice(0, 10) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeDataForLocalStorage(minimalData)));
    } catch {}
  } finally {
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: data }));
  }
}

let globalLastSyncedSha: string | null = null;

export function useCMS() {
  const [data, setData] = useState<CMSDataState>(loadStoredData);

  const syncWithAuthoritativeRemote = async (customSettings?: DeploymentSettings, customToken?: string): Promise<boolean> => {
    const settings = customSettings || data.deploymentSettings;
    const token = (customToken || settings.githubToken || '').trim();
    let remoteMerged = false;

    // 1. Try syncing with authoritative remote GitHub repository FIRST
    if (settings.githubRepo) {
      try {
        const remoteResult = await fetchRemoteCMSDataFromGitHub(settings, token);
        if (remoteResult.success && remoteResult.data) {
          // If HEAD commit SHA is identical to last sync, remote has not changed
          if (remoteResult.headSha && globalLastSyncedSha === remoteResult.headSha) {
            return true;
          }

          if (remoteResult.headSha) {
            globalLastSyncedSha = remoteResult.headSha;
          }

          setData((prev) => {
            const merged = mergeCMSStates(prev, remoteResult.data!);
            saveStoredData(merged);
            return merged;
          });
          remoteMerged = true;

          // Also update local container disk files in background (localD1Server only writes if content differs)
          if (remoteResult.rawFiles && remoteResult.rawFiles.length > 0) {
            fetch('/api/content/sync-disk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ files: remoteResult.rawFiles }),
            }).catch(() => {});
          }
          return true;
        }
      } catch (err) {
        console.warn('Remote GitHub CMS background sync warning:', err);
      }
    }

    // 2. Fallback: Syncing with local dev server disk content (/api/content/all)
    try {
      const res = await fetch('/api/content/all');
      if (res.ok) {
        const diskData = await res.json();
        if (diskData.success) {
          const parsedPosts: Post[] = (diskData.posts || []).map((p: any) =>
            parseFrontmatterAndMarkdown(p.content, p.slug, false) as Post
          );
          const parsedPages: Page[] = (diskData.pages || []).map((p: any) =>
            parseFrontmatterAndMarkdown(p.content, p.slug, true) as Page
          );

          setData((prev) => {
            const merged = mergeCMSStates(prev, {
              posts: parsedPosts.length > 0 ? parsedPosts : undefined,
              pages: parsedPages.length > 0 ? parsedPages : undefined,
              categories: diskData.categories,
              tags: diskData.tags,
              authors: diskData.authors,
              menus: diskData.menus,
              heroConfig: diskData.heroConfig,
              themeSettings: diskData.themeSettings,
            });
            saveStoredData(merged);
            return merged;
          });
          remoteMerged = true;
        }
      }
    } catch (e) {
      // Non-blocking
    }

    return remoteMerged;
  };

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setData(e.detail);
      }
    };
    window.addEventListener(UPDATE_EVENT, handleUpdate);

    // Run authoritative sync on mount in background
    syncWithAuthoritativeRemote().catch(() => {});

    return () => window.removeEventListener(UPDATE_EVENT, handleUpdate);
  }, []);

  const recordCommit = (message: string, currentData?: CMSDataState) => {
    const baseData = currentData || data;
    const newRecord: GitCommitRecord = {
      id: 'c-' + Date.now().toString(36),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      message,
      author: 'Amit Singh <amitsinghpritam@gmail.com>',
      branch: 'main',
      status: 'synced',
    };
    const updated = {
      ...baseData,
      commitHistory: [newRecord, ...(baseData.commitHistory || []).slice(0, 19)],
    };
    saveStoredData(updated);
    setData(updated);
  };

  // POSTS
  const savePost = (post: Post, isPublishAction = false) => {
    const existingIndex = data.posts.findIndex(
      (p) =>
        (post.id && p.id === post.id) ||
        (post.slug && p.slug === post.slug) ||
        (post.originalSlug && (p.slug === post.originalSlug || p.id === `post-${post.originalSlug}`)) ||
        (p.id && post.slug && p.id === `post-${post.slug}`)
    );
    let newPosts: Post[];
    if (existingIndex >= 0) {
      newPosts = [...data.posts];
      const existing = newPosts[existingIndex];
      newPosts[existingIndex] = {
        ...existing,
        ...post,
        id: existing.id || post.id,
      };
    } else {
      newPosts = [post, ...data.posts];
    }
    const updated = { ...data, posts: newPosts };
    saveStoredData(updated);
    setData(updated);

    // Only generate a production Git commit and Cloudflare deployment trigger when explicitly publishing
    if (isPublishAction || post.status === 'published') {
      recordCommit(`feat(post): publish article "${post.title}" [/posts/${post.slug}]`, updated);
    }
  };

  const deletePost = (id: string) => {
    const target = data.posts.find((p) => p.id === id);
    const updated = {
      ...data,
      posts: data.posts.filter((p) => p.id !== id),
    };
    saveStoredData(updated);
    setData(updated);
    if (target && target.slug && typeof window !== 'undefined') {
      fetch('/api/content/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: target.slug, isPage: false }),
      }).catch(() => {});
    }
    if (target && target.status === 'published') {
      recordCommit(`chore(post): remove article "${target.title}"`, updated);
    }
  };

  const duplicatePost = (id: string) => {
    const target = data.posts.find((p) => p.id === id);
    if (!target) return;
    const duplicated: Post = {
      ...target,
      id: 'post-' + Date.now(),
      title: `${target.title} (Draft Copy)`,
      slug: `${target.slug}-copy-${Math.floor(Math.random() * 1000)}`,
      status: 'draft',
      pubDate: new Date().toISOString(),
      views: 0,
    };
    const updated = { ...data, posts: [duplicated, ...data.posts] };
    saveStoredData(updated);
    setData(updated);
  };

  // PAGES
  const savePage = (page: Page, isPublishAction = false) => {
    const existingIndex = data.pages.findIndex(
      (p) =>
        (page.id && p.id === page.id) ||
        (page.slug && p.slug === page.slug) ||
        (page.originalSlug && (p.slug === page.originalSlug || p.id === `page-${page.originalSlug}`)) ||
        (p.id && page.slug && p.id === `page-${page.slug}`)
    );
    let newPages: Page[];
    if (existingIndex >= 0) {
      newPages = [...data.pages];
      const existing = newPages[existingIndex];
      newPages[existingIndex] = {
        ...existing,
        ...page,
        id: existing.id || page.id,
      };
    } else {
      newPages = [...data.pages, page];
    }
    const updated = { ...data, pages: newPages };
    saveStoredData(updated);
    setData(updated);

    if (isPublishAction || page.status === 'published') {
      recordCommit(`feat(page): publish static page "${page.title}" [/${page.slug}]`, updated);
    }
  };

  const deletePage = (id: string) => {
    const target = data.pages.find((p) => p.id === id);
    const updated = {
      ...data,
      pages: data.pages.filter((p) => p.id !== id),
    };
    saveStoredData(updated);
    setData(updated);
    if (target && target.slug && typeof window !== 'undefined') {
      fetch('/api/content/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: target.slug, isPage: true }),
      }).catch(() => {});
    }
    if (target && target.status === 'published') {
      recordCommit(`chore(page): remove static page "${target.title}"`, updated);
    }
  };

  // CATEGORIES
  const saveCategory = (category: Category) => {
    const exists = data.categories.some((c) => c.id === category.id);
    let newCats: Category[];
    if (exists) {
      newCats = data.categories.map((c) => (c.id === category.id ? category : c));
    } else {
      newCats = [...data.categories, category];
    }
    const updated = { ...data, categories: newCats };
    saveStoredData(updated);
    setData(updated);
    recordCommit(`feat(category): ${exists ? 'update' : 'add'} taxonomy "${category.name}"`, updated);
  };

  const deleteCategory = (id: string) => {
    const target = data.categories.find((c) => c.id === id);
    const updated = {
      ...data,
      categories: data.categories.filter((c) => c.id !== id),
    };
    saveStoredData(updated);
    setData(updated);
    if (target) {
      recordCommit(`chore(category): remove taxonomy "${target.name}"`, updated);
    }
  };

  // TAGS
  const saveTag = (tag: Tag) => {
    const exists = data.tags.some((t) => t.id === tag.id);
    let newTags: Tag[];
    if (exists) {
      newTags = data.tags.map((t) => (t.id === tag.id ? tag : t));
    } else {
      newTags = [...data.tags, tag];
    }
    const updated = { ...data, tags: newTags };
    saveStoredData(updated);
    setData(updated);
    recordCommit(`feat(tag): ${exists ? 'update' : 'add'} tag "${tag.name}"`, updated);
  };

  const deleteTag = (id: string) => {
    const target = data.tags.find((t) => t.id === id);
    const updated = {
      ...data,
      tags: data.tags.filter((t) => t.id !== id),
    };
    saveStoredData(updated);
    setData(updated);
    if (target) {
      recordCommit(`chore(tag): remove tag "${target.name}"`, updated);
    }
  };

  // MEDIA
  const addMediaItem = (item: MediaItem) => {
    const updated = { ...data, media: [item, ...data.media] };
    saveStoredData(updated);
    setData(updated);
    recordCommit(`feat(media): upload media asset "${item.name}"`, updated);
  };

  const updateMediaItem = (id: string, updates: Partial<MediaItem>) => {
    const updated = {
      ...data,
      media: data.media.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    };
    saveStoredData(updated);
    setData(updated);
  };

  const deleteMediaItem = (id: string) => {
    const item = data.media.find((m) => m.id === id);
    const updated = { ...data, media: data.media.filter((m) => m.id !== id) };
    saveStoredData(updated);
    setData(updated);
    if (item) {
      recordCommit(`chore(media): remove asset "${item.name}"`, updated);
    }
  };

  // COMMENTS
  const updateCommentStatus = (id: string, status: Comment['status']) => {
    const updated = {
      ...data,
      comments: data.comments.map((c) => (c.id === id ? { ...c, status } : c)),
    };
    saveStoredData(updated);
    setData(updated);
  };

  const addComment = (comment: Comment) => {
    const updated = { ...data, comments: [comment, ...data.comments] };
    saveStoredData(updated);
    setData(updated);
  };

  const addCommentReply = (commentId: string, replyText: string, authorName = 'Amit Singh (Admin)') => {
    const updated = {
      ...data,
      comments: data.comments.map((c) => {
        if (c.id === commentId) {
          const newReplies = [
            ...(c.replies || []),
            {
              id: 'rep-' + Date.now(),
              authorName,
              content: replyText,
              date: new Date().toISOString(),
            },
          ];
          return { ...c, replies: newReplies };
        }
        return c;
      }),
    };
    saveStoredData(updated);
    setData(updated);
  };

  // AUTHORS & USER MANAGEMENT
  const saveAuthor = (author: Author) => {
    const existingIndex = data.authors.findIndex((a) => a.id === author.id);
    let updatedAuthors: Author[];
    if (existingIndex >= 0) {
      updatedAuthors = [...data.authors];
      updatedAuthors[existingIndex] = author;
    } else {
      updatedAuthors = [...data.authors, author];
    }
    const updated = { ...data, authors: updatedAuthors };
    saveStoredData(updated);
    setData(updated);
    recordCommit(`feat(users): ${existingIndex >= 0 ? 'update' : 'add'} user "${author.name}" (${author.role})`, updated);
  };

  const updateAuthorRole = (id: string, role: string) => {
    const target = data.authors.find((a) => a.id === id);
    const updatedAuthors = data.authors.map((a) => (a.id === id ? { ...a, role } : a));
    const updated = { ...data, authors: updatedAuthors };
    saveStoredData(updated);
    setData(updated);
    recordCommit(`feat(access): update role of "${target?.name || id}" to ${role}`, updated);
  };

  const deleteAuthor = (id: string) => {
    const target = data.authors.find((a) => a.id === id);
    const updatedAuthors = data.authors.filter((a) => a.id !== id);
    const updated = { ...data, authors: updatedAuthors };
    saveStoredData(updated);
    setData(updated);
    recordCommit(`feat(users): remove user "${target?.name || id}"`, updated);
  };

  // THEME SETTINGS
  const updateThemeSettings = (newSettings: Partial<ThemeSettings>) => {
    const updatedSettings = { ...data.themeSettings, ...newSettings };
    const updated = { ...data, themeSettings: updatedSettings };
    saveStoredData(updated);
    setData(updated);
    recordCommit('style: update website theme and customizer preferences', updated);
  };

  // SITE SETTINGS
  const updateSiteSettings = (newSettings: Partial<SiteSettings>) => {
    const updatedSiteSettings = { ...data.siteSettings, ...newSettings };
    const updated = { ...data, siteSettings: updatedSiteSettings };
    saveStoredData(updated);
    setData(updated);
    recordCommit('config(site): update global site metadata and permalink structure', updated);
  };

  // TEMPLATES
  const updateTemplate = (id: string, updates: Partial<TemplateConfig>) => {
    const updatedTemplates = data.templates.map((t) => (t.id === id ? { ...t, ...updates } : t));
    const updated = { ...data, templates: updatedTemplates };
    saveStoredData(updated);
    setData(updated);
    recordCommit(`style(template): update template layout config for "${id}"`, updated);
  };

  const updateTemplates = (templates: TemplateConfig[]) => {
    const updated = { ...data, templates };
    saveStoredData(updated);
    setData(updated);
    recordCommit('style(template): update site-wide template layouts', updated);
  };

  // HOMEPAGE SECTIONS
  const updateHomepageSections = (sections: HomepageSection[]) => {
    const updated = { ...data, homepageSections: sections };
    saveStoredData(updated);
    setData(updated);
    recordCommit('feat(homepage): reorder and configure homepage builder sections', updated);
  };

  // MENUS
  const updateMenus = (menus: Menu[]) => {
    const updated = { ...data, menus };
    saveStoredData(updated);
    setData(updated);
    recordCommit('feat(navigation): update navigation menu hierarchy', updated);
  };

  // DEPLOYMENT SETTINGS
  const updateDeploymentSettings = (settings: Partial<DeploymentSettings>) => {
    const updatedSettings = { ...data.deploymentSettings, ...settings };
    const updated = { ...data, deploymentSettings: updatedSettings };
    saveStoredData(updated);
    setData(updated);
    recordCommit('ci(cloudflare): update GitHub and Cloudflare deployment parameters', updated);
  };

  // HERO SECTION CONFIG
  const updateHeroConfig = (config: Partial<HeroSectionConfig>, isPublishAction = false) => {
    const updatedHero = { ...data.heroConfig, ...config };
    const updated = { ...data, heroConfig: updatedHero };
    saveStoredData(updated);
    setData(updated);
    if (isPublishAction) {
      recordCommit('feat(hero): customize homepage hero visual layout and content', updated);
    }
  };

  const resetToFactoryDefaults = () => {
    const clean: CMSDataState = {
      posts: initialPosts,
      pages: initialPages,
      categories: initialCategories,
      tags: initialTags,
      authors: initialAuthors,
      media: initialMedia,
      comments: initialComments,
      menus: initialMenus,
      homepageSections: initialHomepageSections,
      heroConfig: initialHeroConfig,
      themeSettings: initialThemeSettings,
      templates: initialTemplates,
      siteSettings: initialSiteSettings,
      deploymentSettings: initialDeploymentSettings,
      commitHistory: initialCommitHistory,
    };
    saveStoredData(clean);
    setData(clean);
  };

  return {
    ...data,
    savePost,
    deletePost,
    duplicatePost,
    savePage,
    deletePage,
    saveCategory,
    deleteCategory,
    saveTag,
    deleteTag,
    saveAuthor,
    updateAuthorRole,
    deleteAuthor,
    addMediaItem,
    updateMediaItem,
    deleteMediaItem,
    updateCommentStatus,
    addComment,
    addCommentReply,
    updateHeroConfig,
    updateThemeSettings,
    updateSiteSettings,
    updateTemplate,
    updateTemplates,
    updateHomepageSections,
    updateMenus,
    updateDeploymentSettings,
    recordCommit,
    syncWithAuthoritativeRemote,
    resetToFactoryDefaults,
  };
}
