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

  // Mode: 'frontend' website or 'admin' WordPress panel
  const [mode, setMode] = useState<'frontend' | 'admin'>('frontend');
  const [adminView, setAdminView] = useState<AdminView>('dashboard');

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
    acc[cat.name] = cms.posts.filter((p) => p.category === cat.name).length;
    return acc;
  }, {});

  // Handle Frontend Navigation paths
  const handleNavigate = (path: string) => {
    if (path === '/' || path === '') {
      setCurrentRoute({ type: 'home' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (path === '/posts') {
      const techCat = cms.categories[0];
      if (techCat) {
        setCurrentRoute({ type: 'archive', archiveType: 'category', item: techCat });
      }
      return;
    }
    if (path.startsWith('/category/')) {
      const slug = path.replace('/category/', '');
      const cat = cms.categories.find((c) => c.slug === slug);
      if (cat) {
        setCurrentRoute({ type: 'archive', archiveType: 'category', item: cat });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    // Check pages (e.g. /about, /contact, /privacy-policy)
    const cleanSlug = path.replace(/^\//, '');
    const foundPage = cms.pages.find((p) => p.slug === cleanSlug);
    if (foundPage) {
      setCurrentRoute({ type: 'page', page: foundPage });
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (isPublishAction) {
      setEditingPost(null);
    }
  };

  const handleSavePage = (savedPage: Page, isPublishAction = false) => {
    cms.savePage(savedPage, isPublishAction);
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
      {/* 1. WORDPRESS FLOATING ADMIN BAR (Appears on Frontend)                    */}
      {/* ========================================================================= */}
      {mode === 'frontend' && (
        <div className="bg-slate-900 text-slate-300 text-xs px-3 sm:px-4 py-1.5 flex items-center justify-between border-b border-slate-800 z-50 select-none shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setMode('admin');
                setAdminView('dashboard');
              }}
              className="flex items-center gap-1.5 font-bold text-white hover:text-blue-400 transition-colors"
            >
              <div className="h-5 w-5 rounded bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">
                W
              </div>
              <span className="hidden sm:inline">AstroPress Dashboard</span>
            </button>

            <span className="text-slate-600 hidden sm:inline">|</span>

            {/* If currently viewing a post or page, allow instant 1-click edit */}
            {currentRoute.type === 'post' && (
              <button
                onClick={() => {
                  setEditingPost(currentRoute.post);
                  setMode('admin');
                }}
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5 text-blue-400" />
                <span>Edit Post</span>
              </button>
            )}

            {currentRoute.type === 'page' && (
              <button
                onClick={() => {
                  setEditingPage(currentRoute.page);
                  setMode('admin');
                }}
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5 text-blue-400" />
                <span>Edit Page</span>
              </button>
            )}

            <button
              onClick={() => setShowCustomizer(true)}
              className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            >
              <Palette className="h-3.5 w-3.5 text-amber-400" />
              <span>Customize</span>
            </button>

            <button
              onClick={() => {
                handleCreateNewPost();
                setMode('admin');
              }}
              className="hidden sm:flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-400" />
              <span>New Post</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setMode('admin');
                setAdminView('sveltia-native');
              }}
              className="hidden md:flex items-center gap-1 text-[11px] text-blue-300 hover:text-white bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800"
            >
              <Code2 className="h-3 w-3" />
              <span>Sveltia CMS</span>
            </button>

            <span className="text-slate-400 text-[11px] hidden sm:inline">
              Howdy, <b className="text-white">Amit</b>
            </span>

            <button
              onClick={() => {
                setMode('admin');
                setAdminView('dashboard');
              }}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-colors"
            >
              Admin Panel
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LIVE FRONTEND WEBSITE                                                  */}
      {/* ========================================================================= */}
      {mode === 'frontend' && (
        <div className="flex-1 flex flex-col">
          <WebsiteHeader
            themeSettings={cms.themeSettings}
            menus={cms.menus}
            onOpenSearch={() => setIsSearchOpen(true)}
            onNavigate={handleNavigate}
            onOpenAdmin={() => {
              setMode('admin');
              setAdminView('dashboard');
            }}
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
                onSelectPost={(post) => {
                  setCurrentRoute({ type: 'post', post });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectCategory={(cat) => {
                  setCurrentRoute({ type: 'archive', archiveType: 'category', item: cat });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentRoute.type === 'post' && (
              <SinglePostView
                post={currentRoute.post}
                allPosts={cms.posts}
                comments={cms.comments}
                authors={cms.authors}
                onBack={() => setCurrentRoute({ type: 'home' })}
                onEditPost={(p) => {
                  setEditingPost(p);
                  setMode('admin');
                }}
                onSelectPost={(p) => {
                  setCurrentRoute({ type: 'post', post: p });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onAddComment={(newComment) => {
                  cms.addComment(newComment);
                }}
              />
            )}

            {currentRoute.type === 'page' && (
              <SinglePageView
                page={currentRoute.page}
                onBack={() => setCurrentRoute({ type: 'home' })}
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
                onBack={() => setCurrentRoute({ type: 'home' })}
                onSelectPost={(post) => {
                  setCurrentRoute({ type: 'post', post });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
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
            onSelectPost={(post) => {
              setCurrentRoute({ type: 'post', post });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectPage={(page) => {
              setCurrentRoute({ type: 'page', page });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. WORDPRESS ADMIN PANEL                                                  */}
      {/* ========================================================================= */}
      {mode === 'admin' && (
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
          onViewLiveSite={() => setMode('frontend')}
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
              onUpdateSettings={(s) => cms.updateThemeSettings(s)}
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
              media={cms.media}
              menus={cms.menus}
              deploymentSettings={cms.deploymentSettings}
              commitHistory={cms.commitHistory}
              sessionToken={sessionGitHubToken}
              onUpdateSessionToken={(t) => setSessionGitHubToken(t)}
              onUpdateDeploymentSettings={(settings) => cms.updateDeploymentSettings(settings)}
              onRecordCommit={(msg) => cms.recordCommit(msg)}
              onUpdateGithubSyncStatus={(s) => setGithubSyncStatus(s)}
            />
          )}

          {adminView === 'users' && <UsersManager authors={cms.authors} />}

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
