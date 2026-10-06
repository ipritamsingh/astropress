// Guard against "Cannot set property fetch of #<Window> which has only a getter"
try {
  if (typeof window !== 'undefined') {
    const nativeFetch = window.fetch;
    let activeFetch = nativeFetch ? nativeFetch.bind(window) : undefined;
    if (typeof Window !== 'undefined' && Window.prototype) {
      const protoDesc = Object.getOwnPropertyDescriptor(Window.prototype, 'fetch');
      if (protoDesc && !protoDesc.set && protoDesc.configurable) {
        Object.defineProperty(Window.prototype, 'fetch', {
          get() {
            return activeFetch;
          },
          set(fn) {
            activeFetch = typeof fn === 'function' ? fn : nativeFetch;
          },
          configurable: true,
          enumerable: true,
        });
      }
    }
    Object.defineProperty(window, 'fetch', {
      get() {
        return activeFetch;
      },
      set(fn) {
        activeFetch = typeof fn === 'function' ? fn : nativeFetch;
      },
      configurable: true,
      enumerable: true,
    });
  }
} catch (_) {}

import React, { useState } from 'react';
import { useCMS } from './data/cmsStore';
import { Post, Page, Category, Tag, GutenbergBlock, HeroSectionConfig } from './types/cms';

// Frontend Components
import { WebsiteHeader } from './components/frontend/WebsiteHeader';
import { WebsiteFooter } from './components/frontend/WebsiteFooter';
import { HomepageView } from './components/frontend/HomepageView';
import { SinglePostView } from './components/frontend/SinglePostView';
import { SinglePageView } from './components/frontend/SinglePageView';
import { ArchiveView } from './components/frontend/ArchiveView';
import { SearchModal } from './components/frontend/SearchModal';

// Admin Components
import { AdminLayout, AdminView } from './components/admin/AdminLayout';
import { DashboardView } from './components/admin/DashboardView';
import { PostsManager } from './components/admin/PostsManager';
import { PagesManager } from './components/admin/PagesManager';
import { MediaLibrary } from './components/admin/MediaLibrary';
import { CategoriesManager } from './components/admin/CategoriesManager';
import { CommentsManager } from './components/admin/CommentsManager';
import { MenuBuilder } from './components/admin/MenuBuilder';
import { HomepageBuilder } from './components/admin/HomepageBuilder';
import { GutenbergEditor } from './components/admin/GutenbergEditor';
import { ThemeCustomizer } from './components/admin/ThemeCustomizer';
import { SeoManager } from './components/admin/SeoManager';
import { SettingsManager } from './components/admin/SettingsManager';
import { UsersManager } from './components/admin/UsersManager';
import { ToolsExporter } from './components/admin/ToolsExporter';
import { SveltiaNativeFrame } from './components/admin/SveltiaNativeFrame';
import { GitHubDeploymentView } from './components/admin/GitHubDeploymentView';
import { HeroSectionManager } from './components/admin/HeroSectionManager';
import { AccountSecurityManager } from './components/auth/AccountSecurityManager';
import { InitialAdminSetupView } from './components/auth/InitialAdminSetupView';
import { AdminLoginView } from './components/auth/AdminLoginView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { ResetPasswordView } from './components/auth/ResetPasswordView';
import { AuthPublicState, getAuthPublicState, logout } from './data/authService';

// Icons for WordPress Floating Toolbar
import {
  ShieldCheck,
  Edit3,
  Palette,
  Plus,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Code2,
} from 'lucide-react';

type FrontendRoute =
  | { type: 'home' }
  | { type: 'post'; post: Post }
  | { type: 'page'; page: Page }
  | { type: 'archive'; archiveType: 'category' | 'tag'; item: Category | Tag };

export default function App() {
  const cms = useCMS();

  // Authentication & Security State
  const [authState, setAuthState] = useState<AuthPublicState | null>(null);
  const [authAction, setAuthAction] = useState<'login' | 'forgot' | 'reset'>('login');
  const [resetToken, setResetToken] = useState<string>('');

  // Mode: 'frontend' website or 'admin' WordPress panel (accessible via /dashboard, /admin, #admin, ?admin=true)
  const [mode, setMode] = useState<'frontend' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const search = window.location.search;
      const hash = window.location.hash;
      if (
        path.startsWith('/dashboard') ||
        path.startsWith('/admin') ||
        search.includes('admin=true') ||
        search.includes('token=') ||
        hash === '#admin'
      ) {
        return 'admin';
      }
    }
    return 'frontend';
  });
  const [adminView, setAdminView] = useState<AdminView>('dashboard');

  const refreshAuth = async () => {
    try {
      const state = await getAuthPublicState();
      setAuthState(state);
      return state;
    } catch {
      return null;
    }
  };

  React.useEffect(() => {
    refreshAuth();

    const handleUrlCheck = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      const hash = window.location.hash;

      // Check for password reset token in URL parameters
      const urlParams = new URLSearchParams(search);
      const token = urlParams.get('token');
      const action = urlParams.get('action');

      if (token) {
        setResetToken(token);
        setAuthAction('reset');
        setMode('admin');
        return;
      }

      if (action === 'forgot-password') {
        setAuthAction('forgot');
        setMode('admin');
        return;
      }

      if (
        path.startsWith('/dashboard') ||
        path.startsWith('/admin') ||
        search.includes('admin=true') ||
        hash === '#admin'
      ) {
        setMode('admin');
        return;
      }

      const cleanPath = path.replace(/^\//, '').replace(/\/$/, '');

      if (!cleanPath) {
        setCurrentRoute({ type: 'home' });
        setMode('frontend');
        return;
      }

      if (path.startsWith('/posts/')) {
        const postSlug = path.replace('/posts/', '').replace(/\/$/, '');
        let foundPost = cms.posts.find(
          (p) => p.slug.replace(/^\//, '') === postSlug || p.slug === postSlug
        );
        if (!foundPost && typeof window !== 'undefined' && (window as any).__ASTROPRESS_INITIAL_POST__) {
          const serverP = (window as any).__ASTROPRESS_INITIAL_POST__;
          if (serverP.slug === postSlug || serverP.slug?.replace(/^\//, '') === postSlug) {
            foundPost = serverP;
          }
        }
        if (foundPost) {
          setCurrentRoute({ type: 'post', post: foundPost });
          setMode('frontend');
          return;
        }
      }

      if (path.startsWith('/category/')) {
        const catSlug = path.replace('/category/', '').replace(/\/$/, '');
        const cat = cms.categories.find(
          (c) => c.slug === catSlug || c.name.toLowerCase() === catSlug.toLowerCase()
        );
        if (cat) {
          setCurrentRoute({ type: 'archive', archiveType: 'category', item: cat });
          setMode('frontend');
          return;
        }
      }

      // Check day/month/year permalink: e.g. /2026/09/30/my-post/
      const dayNameMatch = path.match(/^\/\d{4}\/\d{2}\/\d{2}\/([^/]+)\/?$/);
      if (dayNameMatch) {
        const postSlug = dayNameMatch[1];
        const foundPost = cms.posts.find(
          (p) => p.slug.replace(/^\//, '') === postSlug || p.slug === postSlug
        );
        if (foundPost && foundPost.status === 'published') {
          setCurrentRoute({ type: 'post', post: foundPost });
          setMode('frontend');
          return;
        }
      }

      // Check numeric archives permalink: e.g. /archives/post-1/
      const archiveIdMatch = path.match(/^\/archives\/([^/]+)\/?$/);
      if (archiveIdMatch) {
        const postIdOrSlug = archiveIdMatch[1];
        const foundPost = cms.posts.find(
          (p) => p.id === postIdOrSlug || p.slug.replace(/^\//, '') === postIdOrSlug
        );
        if (foundPost && foundPost.status === 'published') {
          setCurrentRoute({ type: 'post', post: foundPost });
          setMode('frontend');
          return;
        }
      }

      // Check /pages/:slug prefix
      if (path.startsWith('/pages/')) {
        const pageSlug = path.replace('/pages/', '').replace(/\/$/, '');
        const foundPage = cms.pages.find(
          (p) => p.slug.replace(/^\//, '') === pageSlug || p.slug === pageSlug
        );
        if (foundPage) {
          setCurrentRoute({ type: 'page', page: foundPage });
          setMode('frontend');
          return;
        }
      }

      // Static Page check (e.g. /about, /contact, /privacy-policy)
      let foundPage = cms.pages.find(
        (p) => p.slug.replace(/^\//, '') === cleanPath || p.slug === cleanPath
      );
      if (!foundPage && typeof window !== 'undefined' && (window as any).__ASTROPRESS_INITIAL_PAGE__) {
        foundPage = (window as any).__ASTROPRESS_INITIAL_PAGE__;
      }
      if (foundPage) {
        setCurrentRoute({ type: 'page', page: foundPage });
        setMode('frontend');
        return;
      }

      // Direct post slug check for Root-level permalink structure (e.g. /demo-check or /demo-check/)
      let foundPost = cms.posts.find(
        (p) => p.slug.replace(/^\//, '') === cleanPath || p.slug === cleanPath
      );
      if (!foundPost && typeof window !== 'undefined' && (window as any).__ASTROPRESS_INITIAL_POST__) {
        const serverP = (window as any).__ASTROPRESS_INITIAL_POST__;
        if (serverP.slug === cleanPath || serverP.slug?.replace(/^\//, '') === cleanPath) {
          foundPost = serverP;
        }
      }
      if (foundPost && foundPost.status === 'published') {
        setCurrentRoute({ type: 'post', post: foundPost });
        setMode('frontend');
        return;
      }
    };

    handleUrlCheck();
    window.addEventListener('popstate', handleUrlCheck);
    window.addEventListener('hashchange', handleUrlCheck);
    return () => {
      window.removeEventListener('popstate', handleUrlCheck);
      window.removeEventListener('hashchange', handleUrlCheck);
    };
  }, []);

  // Currently editing post or page in the Gutenberg Block Editor
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [sessionGitHubToken, setSessionGitHubToken] = useState<string>('');
  const [githubSyncStatus, setGithubSyncStatus] = useState<'Connected' | 'Syncing' | 'Error' | 'Disconnected'>('Connected');

  // Frontend routing state
  const [currentRoute, setCurrentRoute] = useState<FrontendRoute>({ type: 'home' });
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Count pending comments
  const pendingCommentsCount = cms.comments.filter((c) => c.status === 'pending').length;

  // Calculate post counts per category
  const postCountsByCategory = cms.categories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.name] = cms.posts.filter((p) => {
      if (p.status !== 'published') return false;
      const pCat = (p.category || '').trim().toLowerCase();
      return pCat === (cat.name || '').trim().toLowerCase() || pCat === (cat.slug || '').trim().toLowerCase() || pCat === cat.id;
    }).length;
    return acc;
  }, {});

  const handleSelectPost = (post: Post) => {
    if (post.status !== 'published') return;
    const cleanSlug = post.slug.replace(/^\//, '');
    setCurrentRoute({ type: 'post', post });
    setMode('frontend');
    if (typeof window !== 'undefined') {
      const permalinkStruct = cms.siteSettings?.permalinkStructure || '/%postname%/';
      let targetUrl = `/${cleanSlug}/`;
      if (permalinkStruct === '/posts/%postname%/') {
        targetUrl = `/posts/${cleanSlug}/`;
      } else if (permalinkStruct === '/%year%/%month%/%day%/%postname%/') {
        const d = new Date(post.pubDate || Date.now());
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        targetUrl = `/${year}/${month}/${day}/${cleanSlug}/`;
      } else if (permalinkStruct === '/archives/%post_id%/') {
        targetUrl = `/archives/${post.id}/`;
      } else {
        // Root-level: /%postname%/
        targetUrl = `/${cleanSlug}/`;
      }
      window.history.pushState({}, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPage = (page: Page) => {
    const cleanSlug = page.slug.replace(/^\//, '');
    setCurrentRoute({ type: 'page', page });
    setMode('frontend');
    if (typeof window !== 'undefined') {
      const pageFormat = cms.siteSettings?.pagePermalinkStructure || '/%pagename%/';
      const targetUrl = pageFormat === '/pages/%pagename%/' ? `/pages/${cleanSlug}/` : `/${cleanSlug}/`;
      window.history.pushState({}, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (cat: Category) => {
    setCurrentRoute({ type: 'archive', archiveType: 'category', item: cat });
    setMode('frontend');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/category/${cat.slug}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Frontend Navigation paths
  const handleNavigate = (path: string) => {
    // Admin route navigation
    if (path === '/admin' || path === '/dashboard' || path.startsWith('/admin') || path.startsWith('/dashboard')) {
      setMode('admin');
      setAdminView('dashboard');
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/dashboard');
      }
      return;
    }

    if (path === '/' || path === '') {
      setCurrentRoute({ type: 'home' });
      setMode('frontend');
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (path === '/posts') {
      const techCat = cms.categories[0];
      if (techCat) {
        handleSelectCategory(techCat);
      }
      return;
    }

    const cleanPathSlug = path.replace(/^\//, '').replace(/\/$/, '');

    // Check if path is /posts/:slug
    if (path.startsWith('/posts/')) {
      const postSlug = path.replace('/posts/', '').replace(/\/$/, '');
      const foundPost = cms.posts.find(
        (p) => p.slug.replace(/^\//, '') === postSlug || p.slug === postSlug
      );
      if (foundPost && foundPost.status === 'published') {
        handleSelectPost(foundPost);
        return;
      }
    }

    // Check if path is /pages/:slug
    if (path.startsWith('/pages/')) {
      const pageSlug = path.replace('/pages/', '').replace(/\/$/, '');
      const foundPage = cms.pages.find(
        (p) => p.slug.replace(/^\//, '') === pageSlug || p.slug === pageSlug
      );
      if (foundPage) {
        handleSelectPage(foundPage);
        return;
      }
    }

    // Check category archive e.g. /category/:slug
    if (path.startsWith('/category/')) {
      const slug = path.replace('/category/', '').replace(/\/$/, '');
      const cat = cms.categories.find(
        (c) => c.slug === slug || c.name.toLowerCase() === slug.toLowerCase()
      );
      if (cat) {
        handleSelectCategory(cat);
        return;
      }
    }

    // Direct post slug check (e.g. /demo-check)
    const foundPostDirect = cms.posts.find(
      (p) => p.slug.replace(/^\//, '') === cleanPathSlug || p.slug === cleanPathSlug
    );
    if (foundPostDirect && foundPostDirect.status === 'published') {
      handleSelectPost(foundPostDirect);
      return;
    }

    // Check pages (e.g. /about, /contact, /privacy-policy)
    const foundPage = cms.pages.find(
      (p) => p.slug.replace(/^\//, '') === cleanPathSlug || p.slug === cleanPathSlug
    );
    if (foundPage) {
      handleSelectPage(foundPage);
      return;
    }
  };

  // Actions for Post & Page creation
  const handleCreateNewPost = () => {
    const newPost: Post = {
      id: 'post-' + Date.now(),
      title: '',
      slug: '',
      pubDate: new Date().toISOString(),
      status: 'draft',
      author: cms.authors[0]?.name || 'Amit Singh',
      category: cms.categories[0]?.name || 'Technology',
      tags: ['Astro', 'Sveltia CMS'],
      featuredImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      excerpt: '',
      readingTime: 4,
      template: 'standard',
      blocks: [
        {
          id: 'b-new-1',
          type: 'heading',
          content: 'Title of your new story...',
          settings: { level: 2 },
        },
        {
          id: 'b-new-2',
          type: 'paragraph',
          content: 'Start writing your engaging article here. You can add columns, alerts, and quotes from the block inserter.',
          settings: { fontSize: 'medium' },
        },
      ],
      body: '',
      seo: {
        metaTitle: '',
        metaDescription: '',
        focusKeyword: '',
        robotsIndex: true,
        robotsFollow: true,
      },
      views: 0,
    };
    setEditingPost(newPost);
    setEditingPage(null);
  };

  const handleCreateNewPage = () => {
    const newPage: Page = {
      id: 'page-' + Date.now(),
      title: 'New Page',
      slug: 'new-page-' + Math.floor(Math.random() * 1000),
      status: 'draft',
      template: 'default',
      blocks: [
        {
          id: 'bp-1',
          type: 'heading',
          content: 'New Page Heading',
          settings: { level: 2 },
        },
        {
          id: 'bp-2',
          type: 'paragraph',
          content: 'Add structured page content here.',
          settings: {},
        },
      ],
      body: 'Page body description...',
      seo: {
        metaTitle: 'New Page',
        metaDescription: '',
        focusKeyword: '',
        robotsIndex: true,
        robotsFollow: true,
      },
    };
    setEditingPage(newPage);
    setEditingPost(null);
  };

  const handleSavePost = (savedPost: Post, isPublishAction = false) => {
    cms.savePost(savedPost, isPublishAction);
    setEditingPost(savedPost);
    if (isPublishAction) {
      setEditingPost(null);
    }
  };

  const handleSavePage = (savedPage: Page, isPublishAction = false) => {
    cms.savePage(savedPage, isPublishAction);
    setEditingPage(savedPage);
    if (isPublishAction) {
      setEditingPage(null);
    }
  };

  return (
    <div
      style={{
        backgroundColor: cms.themeSettings.backgroundColor,
        color: cms.themeSettings.textColor,
        fontFamily:
          cms.themeSettings.bodyFont === 'Source Serif 4'
            ? "'Source Serif 4', Georgia, serif"
            : "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
      className="min-h-screen flex flex-col font-sans"
    >
      {/* ========================================================================= */}
      {/* 1. LIVE FRONTEND WEBSITE                                                  */}
      {/* ========================================================================= */}
      {mode === 'frontend' && (
        <div className="flex-1 flex flex-col">
          <WebsiteHeader
            themeSettings={cms.themeSettings}
            menus={cms.menus}
            onOpenSearch={() => setIsSearchOpen(true)}
            onNavigate={handleNavigate}
          />

          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            {currentRoute.type === 'home' && (
              <HomepageView
                posts={cms.posts}
                categories={cms.categories}
                sections={cms.homepageSections}
                heroConfig={cms.heroConfig}
                themeSettings={cms.themeSettings}
                onNavigate={handleNavigate}
                onSelectPost={handleSelectPost}
                onSelectCategory={handleSelectCategory}
              />
            )}

            {currentRoute.type === 'post' && (
              <SinglePostView
                post={currentRoute.post}
                allPosts={cms.posts}
                comments={cms.comments}
                authors={cms.authors}
                onBack={() => {
                  setCurrentRoute({ type: 'home' });
                  if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onEditPost={(p) => {
                  setEditingPost(p);
                  setMode('admin');
                }}
                onSelectPost={handleSelectPost}
                onAddComment={(newComment) => {
                  cms.addComment(newComment);
                }}
              />
            )}

            {currentRoute.type === 'page' && (
              <SinglePageView
                page={currentRoute.page}
                onBack={() => {
                  setCurrentRoute({ type: 'home' });
                  if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onEditPage={(pg) => {
                  setEditingPage(pg);
                  setMode('admin');
                }}
              />
            )}

            {currentRoute.type === 'archive' && (
              <ArchiveView
                type={currentRoute.archiveType}
                item={currentRoute.item}
                posts={cms.posts}
                onBack={() => {
                  setCurrentRoute({ type: 'home' });
                  if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectPost={handleSelectPost}
              />
            )}
          </main>

          <WebsiteFooter
            themeSettings={cms.themeSettings}
            menus={cms.menus}
            categories={cms.categories}
            onNavigate={handleNavigate}
            onOpenAdmin={() => {
              setMode('admin');
              setAdminView('dashboard');
            }}
          />

          {/* Search Modal */}
          <SearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            posts={cms.posts}
            pages={cms.pages}
            categories={cms.categories}
            onSelectPost={handleSelectPost}
            onSelectPage={handleSelectPage}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADMIN AUTHENTICATION & SECURITY GATES                                  */}
      {/* ========================================================================= */}
      {mode === 'admin' && !authState && (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-xs text-slate-400 font-medium">Verifying Administrator Session...</span>
          </div>
        </div>
      )}

      {/* One-time Initial Setup (shown only when uninitialized) */}
      {mode === 'admin' && authState && !authState.isInitialized && (
        <InitialAdminSetupView
          onSetupComplete={async () => {
            await refreshAuth();
            setAuthAction('login');
          }}
        />
      )}

      {/* Password Reset with Token */}
      {mode === 'admin' && authState && authState.isInitialized && authAction === 'reset' && (
        <ResetPasswordView
          token={resetToken}
          onResetSuccess={async () => {
            await refreshAuth();
            setAuthAction('login');
            if (typeof window !== 'undefined') {
              window.history.replaceState({}, '', '/dashboard');
            }
          }}
          onBackToLogin={() => {
            setAuthAction('login');
            if (typeof window !== 'undefined') {
              window.history.replaceState({}, '', '/dashboard');
            }
          }}
        />
      )}

      {/* Forgot Password Request */}
      {mode === 'admin' && authState && authState.isInitialized && authAction === 'forgot' && (
        <ForgotPasswordView
          onBackToLogin={() => setAuthAction('login')}
        />
      )}

      {/* Dedicated Admin Login Screen */}
      {mode === 'admin' &&
        authState &&
        authState.isInitialized &&
        !authState.isAuthenticated &&
        authAction === 'login' && (
          <AdminLoginView
            onLoginSuccess={async () => {
              await refreshAuth();
            }}
            onForgotPassword={() => setAuthAction('forgot')}
            onBackToHome={() => {
              setMode('frontend');
              if (typeof window !== 'undefined') {
                window.history.pushState({}, '', '/');
              }
            }}
          />
        )}

      {/* ========================================================================= */}
      {/* 3. WORDPRESS ADMIN PANEL (PROTECTED FOR AUTHENTICATED ADMINISTRATORS)      */}
      {/* ========================================================================= */}
      {mode === 'admin' && authState && authState.isInitialized && authState.isAuthenticated && (
        <AdminLayout
          currentView={adminView}
          onSelectView={(view) => {
            if (view === 'customizer') {
              setShowCustomizer(true);
            } else {
              setAdminView(view);
            }
          }}
          pendingCommentsCount={pendingCommentsCount}
          themeSettings={cms.themeSettings}
          deploymentSettings={cms.deploymentSettings}
          githubSyncStatus={githubSyncStatus}
          currentUsername={authState.currentUser?.username}
          onViewLiveSite={() => setMode('frontend')}
          onLogout={async () => {
            await logout();
            await refreshAuth();
            setMode('frontend');
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/');
            }
          }}
          onNewPost={handleCreateNewPost}
          onNewPage={handleCreateNewPage}
        >
          {adminView === 'dashboard' && (
            <DashboardView
              posts={cms.posts}
              pages={cms.pages}
              categories={cms.categories}
              media={cms.media}
              comments={cms.comments}
              commitHistory={cms.commitHistory}
              onNewPost={handleCreateNewPost}
              onNewPage={handleCreateNewPage}
              onEditPost={(p) => setEditingPost(p)}
              onNavigateToView={(view) => {
                if (view === 'customizer') setShowCustomizer(true);
                else setAdminView(view);
              }}
              onSaveQuickDraft={(title, content) => {
                const quickDraft: Post = {
                  id: 'post-' + Date.now(),
                  title,
                  slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  pubDate: new Date().toISOString(),
                  status: 'draft',
                  author: cms.authors[0]?.name || 'Amit Singh',
                  category: cms.categories[0]?.name || 'Technology',
                  tags: ['QuickDraft'],
                  featuredImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
                  excerpt: content.substring(0, 140),
                  readingTime: 3,
                  template: 'standard',
                  blocks: [
                    {
                      id: 'qb-1',
                      type: 'paragraph',
                      content,
                      settings: {},
                    },
                  ],
                  body: content,
                  seo: {
                    metaTitle: title,
                    metaDescription: content.substring(0, 140),
                    focusKeyword: '',
                    robotsIndex: false,
                    robotsFollow: false,
                  },
                };
                cms.savePost(quickDraft);
              }}
            />
          )}

          {adminView === 'posts' && (
            <PostsManager
              posts={cms.posts}
              categories={cms.categories}
              authors={cms.authors}
              onNewPost={handleCreateNewPost}
              onEditPost={(p) => setEditingPost(p)}
              onDeletePost={(id) => cms.deletePost(id)}
              onDuplicatePost={(id) => cms.duplicatePost(id)}
              onViewPost={(p) => {
                setCurrentRoute({ type: 'post', post: p });
                setMode('frontend');
              }}
            />
          )}

          {adminView === 'pages' && (
            <PagesManager
              pages={cms.pages}
              onNewPage={handleCreateNewPage}
              onEditPage={(pg) => setEditingPage(pg)}
              onDeletePage={(id) => cms.deletePage(id)}
              onDuplicatePage={(id) => {
                const target = cms.pages.find((p) => p.id === id);
                if (target) {
                  cms.savePage({
                    ...target,
                    id: 'page-' + Date.now(),
                    title: `${target.title} (Copy)`,
                    slug: `${target.slug}-copy`,
                    status: 'draft',
                  });
                }
              }}
              onViewPage={(pg) => {
                setCurrentRoute({ type: 'page', page: pg });
                setMode('frontend');
              }}
            />
          )}

          {adminView === 'media' && (
            <MediaLibrary
              media={cms.media}
              onAddMedia={(item) => cms.addMediaItem(item)}
              onUpdateMedia={(id, updates) => cms.updateMediaItem(id, updates)}
              onDeleteMedia={(id) => cms.deleteMediaItem(id)}
            />
          )}

          {(adminView === 'categories' || adminView === 'tags') && (
            <CategoriesManager
              categories={cms.categories}
              tags={cms.tags}
              onSaveCategory={(c) => cms.saveCategory(c)}
              onDeleteCategory={(id) => cms.deleteCategory(id)}
              onSaveTag={(t) => cms.saveTag(t)}
              onDeleteTag={(id) => cms.deleteTag(id)}
              postCountsByCategory={postCountsByCategory}
            />
          )}

          {adminView === 'comments' && (
            <CommentsManager
              comments={cms.comments}
              onUpdateStatus={(id, status) => cms.updateCommentStatus(id, status)}
              onAddReply={(id, replyText) => cms.addCommentReply(id, replyText)}
            />
          )}

          {adminView === 'menus' && (
            <MenuBuilder
              menus={cms.menus}
              pages={cms.pages}
              categories={cms.categories}
              onSaveMenus={(m) => cms.updateMenus(m)}
            />
          )}

          {adminView === 'hero-section' && (
            <HeroSectionManager
              config={cms.heroConfig}
              deploymentSettings={cms.deploymentSettings}
              sessionToken={sessionGitHubToken}
              onSaveHeroConfig={(cfg, isPublish) => cms.updateHeroConfig(cfg, isPublish)}
              onRecordCommit={(msg) => cms.recordCommit(msg)}
            />
          )}

          {adminView === 'homepage-builder' && (
            <HomepageBuilder
              sections={cms.homepageSections}
              onSaveSections={(s) => cms.updateHomepageSections(s)}
            />
          )}

          {adminView === 'block-editor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Gutenberg Block Editor Suite</h2>
                  <p className="text-xs text-slate-500">
                    Select any post to open the visual block editor, or create a new block layout below.
                  </p>
                </div>
                <button
                  onClick={handleCreateNewPost}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  + Launch New Post Canvas
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {cms.posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setEditingPost(post)}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all space-y-2"
                  >
                    <span className="text-[10px] font-bold text-blue-600 uppercase">{post.category}</span>
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{post.title}</h3>
                    <p className="text-xs text-slate-500">{post.blocks?.length || 0} Gutenberg blocks</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminView === 'hero-section' && (
            <HeroSectionManager
              config={cms.heroConfig}
              deploymentSettings={cms.deploymentSettings}
              sessionToken={sessionGitHubToken}
              onSaveHeroConfig={(config: HeroSectionConfig, isPublishAction?: boolean) =>
                cms.updateHeroConfig(config, isPublishAction)
              }
              onRecordCommit={(msg: string) => cms.recordCommit(msg)}
            />
          )}

          {adminView === 'seo' && (
            <SeoManager
              posts={cms.posts}
              pages={cms.pages}
              themeSettings={cms.themeSettings}
              onSaveSeoSettings={(seoSettings) => {
                cms.recordCommit('seo: update global search metadata and sitemap settings');
              }}
            />
          )}

          {adminView === 'settings' && (
            <SettingsManager
              themeSettings={cms.themeSettings}
              siteSettings={cms.siteSettings}
              onUpdateSettings={(s) => cms.updateThemeSettings(s)}
              onUpdateSiteSettings={(s) => cms.updateSiteSettings(s)}
              onResetDefaults={() => cms.resetToFactoryDefaults()}
            />
          )}

          {adminView === 'github-deployment' && (
            <GitHubDeploymentView
              posts={cms.posts}
              pages={cms.pages}
              heroConfig={cms.heroConfig}
              themeSettings={cms.themeSettings}
              categories={cms.categories}
              tags={cms.tags}
              authors={cms.authors}
              media={cms.media}
              menus={cms.menus}
              deploymentSettings={cms.deploymentSettings}
              commitHistory={cms.commitHistory}
              sessionToken={sessionGitHubToken}
              onUpdateSessionToken={(t) => setSessionGitHubToken(t)}
              onUpdateDeploymentSettings={(settings) => cms.updateDeploymentSettings(settings)}
              onRecordCommit={(msg) => cms.recordCommit(msg)}
              onUpdateGithubSyncStatus={(s) => setGithubSyncStatus(s)}
              onSyncRemoteCMS={() => cms.syncWithAuthoritativeRemote()}
            />
          )}

          {adminView === 'account-security' && (
            <AccountSecurityManager onAuthStateChange={refreshAuth} />
          )}

          {adminView === 'users' && (
            <UsersManager
              authors={cms.authors}
              onAddAuthor={(author) => cms.saveAuthor(author)}
              onUpdateAuthorRole={(id, role) => cms.updateAuthorRole(id, role)}
              onDeleteAuthor={(id) => cms.deleteAuthor(id)}
              currentUserEmail={authState?.currentUser?.email}
              onNavigateToSecurity={() => setAdminView('account-security')}
            />
          )}

          {adminView === 'tools' && (
            <ToolsExporter
              posts={cms.posts}
              pages={cms.pages}
              categories={cms.categories}
              tags={cms.tags}
              themeSettings={cms.themeSettings}
            />
          )}

          {adminView === 'sveltia-native' && <SveltiaNativeFrame />}
        </AdminLayout>
      )}

      {/* ========================================================================= */}
      {/* 4. MODALS: GUTENBERG VISUAL BLOCK EDITOR                                  */}
      {/* ========================================================================= */}
      {editingPost && (
        <GutenbergEditor
          initialItem={editingPost}
          isPage={false}
          categories={cms.categories}
          tags={cms.tags}
          authors={cms.authors}
          mediaLibrary={cms.media}
          existingSlugs={cms.posts.filter((p) => p.id !== editingPost.id).map((p) => p.slug)}
          deploymentSettings={cms.deploymentSettings}
          sessionToken={sessionGitHubToken}
          onAddMedia={(item) => cms.addMediaItem(item)}
          onUpdateMedia={(id, updates) => cms.updateMediaItem(id, updates)}
          onDeleteMedia={(id) => cms.deleteMediaItem(id)}
          onSave={(item, isPublish) => handleSavePost(item, isPublish)}
          onClose={() => setEditingPost(null)}
        />
      )}

      {editingPage && (
        <GutenbergEditor
          initialItem={editingPage}
          isPage={true}
          categories={cms.categories}
          tags={cms.tags}
          authors={cms.authors}
          mediaLibrary={cms.media}
          existingSlugs={cms.pages.filter((p) => p.id !== editingPage.id).map((p) => p.slug)}
          deploymentSettings={cms.deploymentSettings}
          sessionToken={sessionGitHubToken}
          onAddMedia={(item) => cms.addMediaItem(item)}
          onUpdateMedia={(id, updates) => cms.updateMediaItem(id, updates)}
          onDeleteMedia={(id) => cms.deleteMediaItem(id)}
          onSave={(item, isPublish) => handleSavePage(item, isPublish)}
          onClose={() => setEditingPage(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. MODALS: LIVE WORDPRESS THEME CUSTOMIZER                                */}
      {/* ========================================================================= */}
      {showCustomizer && (
        <ThemeCustomizer
          settings={cms.themeSettings}
          homepageSections={cms.homepageSections}
          posts={cms.posts}
          categories={cms.categories}
          onSaveSettings={(newSettings) => cms.updateThemeSettings(newSettings)}
          onSaveHomepageSections={(newSections) => cms.updateHomepageSections(newSections)}
          onClose={() => setShowCustomizer(false)}
        />
      )}
    </div>
  );
}
