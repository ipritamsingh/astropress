import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Image as ImageIcon,
  Files,
  FolderTree,
  Tag as TagIcon,
  MessageSquare,
  Menu as MenuIcon,
  LayoutTemplate,
  Box,
  Palette,
  Sliders,
  Search,
  Settings,
  Users,
  Wrench,
  Globe,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Plus,
  Bell,
  User,
  LogOut,
  Sparkles,
  GitBranch,
  CheckCircle2,
  X,
  Code2,
  Compass,
  RefreshCw,
  Cloud,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { ThemeSettings, DeploymentSettings } from '../../types/cms';

export type AdminView =
  | 'dashboard'
  | 'posts'
  | 'pages'
  | 'media'
  | 'hero-section'
  | 'categories'
  | 'tags'
  | 'comments'
  | 'menus'
  | 'homepage-builder'
  | 'block-editor'
  | 'customizer'
  | 'seo'
  | 'users'
  | 'settings'
  | 'github-deployment'
  | 'tools'
  | 'sveltia-native'
  | 'account-security';

interface Props {
  currentView: AdminView;
  onSelectView: (view: AdminView) => void;
  pendingCommentsCount: number;
  themeSettings: ThemeSettings;
  deploymentSettings?: DeploymentSettings;
  githubSyncStatus?: 'Connected' | 'Syncing' | 'Error' | 'Disconnected';
  onViewLiveSite: () => void;
  onLogout?: () => void;
  currentUsername?: string;
  onNewPost: () => void;
  onNewPage: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<Props> = ({
  currentView,
  onSelectView,
  pendingCommentsCount,
  themeSettings,
  deploymentSettings,
  githubSyncStatus = 'Connected',
  onViewLiveSite,
  onLogout,
  currentUsername = 'Administrator',
  onNewPost,
  onNewPage,
  children,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'posts', label: 'Posts', icon: <FileText className="h-4 w-4" /> },
    { id: 'hero-section', label: 'Hero Section', icon: <Sparkles className="h-4 w-4 text-amber-500" /> },
    { id: 'media', label: 'Media Library', icon: <ImageIcon className="h-4 w-4" /> },
    { id: 'pages', label: 'Pages', icon: <Files className="h-4 w-4" /> },
    { id: 'categories', label: 'Categories', icon: <FolderTree className="h-4 w-4" /> },
    { id: 'tags', label: 'Tags', icon: <TagIcon className="h-4 w-4" /> },
    {
      id: 'comments',
      label: 'Comments',
      icon: <MessageSquare className="h-4 w-4" />,
      badge: pendingCommentsCount > 0 ? pendingCommentsCount : undefined,
    },
    { id: 'menus', label: 'Navigation Menus', icon: <MenuIcon className="h-4 w-4" /> },
    { id: 'homepage-builder', label: 'Homepage Builder', icon: <LayoutTemplate className="h-4 w-4" /> },
    { id: 'block-editor', label: 'Gutenberg Blocks', icon: <Box className="h-4 w-4" /> },
    { id: 'customizer', label: 'Theme Customizer', icon: <Palette className="h-4 w-4" /> },
    { id: 'seo', label: 'SEO Management', icon: <Search className="h-4 w-4" /> },
    { id: 'account-security', label: 'Account Security', icon: <Shield className="h-4 w-4 text-emerald-400" /> },
    { id: 'users', label: 'Users & Access', icon: <Users className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
    { id: 'github-deployment', label: 'GitHub & Deployment', icon: <GitBranch className="h-4 w-4" /> },
    { id: 'tools', label: 'Tools & Astro Export', icon: <Wrench className="h-4 w-4" /> },
    { id: 'sveltia-native', label: 'Native Sveltia CMS', icon: <Code2 className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none text-slate-800">
      {/* ========================================================================= */}
      {/* TOP WORDPRESS ADMIN BAR                                                   */}
      {/* ========================================================================= */}
      <header className="h-12 bg-slate-900 text-slate-200 px-3 flex items-center justify-between z-30 shrink-0 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="md:hidden p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <MenuIcon className="h-4 w-4" />
          </button>

          {/* WordPress / AstroPress W-Logo Mark */}
          <div
            onClick={onViewLiveSite}
            className="flex items-center gap-2 cursor-pointer group hover:text-white"
            title="AstroPress — WordPress-Style Sveltia CMS"
          >
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs group-hover:bg-blue-500 transition-colors">
              W
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:inline text-white">
              {themeSettings.siteName}
            </span>
          </div>

          {/* Visit Site Button */}
          <button
            onClick={onViewLiveSite}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium transition-colors"
          >
            <Globe className="h-3.5 w-3.5 text-blue-400" />
            <span>Visit Site</span>
          </button>

          {/* + New Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNewDropdown(!showNewDropdown)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-400" />
              <span>New</span>
            </button>
            {showNewDropdown && (
              <div className="absolute top-8 left-0 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 z-50">
                <button
                  onClick={() => {
                    onNewPost();
                    setShowNewDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 text-xs font-medium"
                >
                  Post
                </button>
                <button
                  onClick={() => {
                    onNewPage();
                    setShowNewDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 text-xs font-medium"
                >
                  Page
                </button>
                <button
                  onClick={() => {
                    onSelectView('media');
                    setShowNewDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 text-xs font-medium"
                >
                  Media
                </button>
                <button
                  onClick={() => {
                    onSelectView('categories');
                    setShowNewDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 text-xs font-medium"
                >
                  Category
                </button>
              </div>
            )}
          </div>

          {/* GitHub Sync & Connection Visual Status Indicator */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-200 transition-all shadow-xs cursor-pointer"
              title="GitHub Backend Connection & Deployment Status"
            >
              <div className="flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5 text-purple-400" />
                <span className="font-mono text-purple-300 font-semibold">
                  {deploymentSettings?.githubBranch || 'main'}
                </span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5">
                {githubSyncStatus === 'Connected' && (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-emerald-400 font-bold">Connected</span>
                  </>
                )}
                {githubSyncStatus === 'Syncing' && (
                  <>
                    <RefreshCw className="h-3 w-3 text-blue-400 animate-spin" />
                    <span className="text-blue-400 font-bold">Syncing...</span>
                  </>
                )}
                {githubSyncStatus === 'Error' && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="text-rose-400 font-bold">Connection Error</span>
                  </>
                )}
                {githubSyncStatus === 'Disconnected' && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-amber-400 font-bold">Unlinked</span>
                  </>
                )}
              </div>
            </button>

            {/* GitHub Status Dropdown Popover */}
            {showStatusDropdown && (
              <div className="absolute top-8 left-0 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-purple-400" />
                    <span className="font-bold text-white text-xs">GitHub & Cloudflare Status</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      githubSyncStatus === 'Connected'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : githubSyncStatus === 'Syncing'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {githubSyncStatus}
                  </span>
                </div>

                <div className="space-y-2 text-slate-300">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Repository:</span>
                    <code className="text-purple-300 font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded">
                      {deploymentSettings?.githubRepo || 'ipritamsingh/astropress'}
                    </code>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Git Branch:</span>
                    <span className="font-mono text-slate-200">
                      {deploymentSettings?.githubBranch || 'main'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Cloudflare Pages:</span>
                    <a
                      href={deploymentSettings?.productionUrl || 'https://4c8996b1.astropress-ejr.pages.dev'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline font-medium flex items-center gap-1"
                    >
                      <span className="truncate max-w-[140px]">
                        {deploymentSettings?.productionUrl || '4c8996b1.astropress-ejr.pages.dev'}
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectView('github-deployment');
                      setShowStatusDropdown(false);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-center text-[11px] transition-colors"
                  >
                    Manage Deployment
                  </button>
                  <a
                    href={deploymentSettings?.productionUrl || 'https://4c8996b1.astropress-ejr.pages.dev'}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-center text-[11px] transition-colors flex items-center gap-1"
                  >
                    <span>View Site</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Admin Tools */}
        <div className="flex items-center gap-2">
          {/* Quick Switch to Native Sveltia CMS */}
          <button
            onClick={() => onSelectView('sveltia-native')}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              currentView === 'sveltia-native'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Code2 className="h-3.5 w-3.5 text-blue-400" />
            <span>Sveltia CMS Direct</span>
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 text-slate-200"
            >
              <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold ring-1 ring-blue-400">
                {currentUsername.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline font-semibold">Howdy, {currentUsername}</span>
            </button>

            {showUserDropdown && (
              <div className="absolute top-9 right-0 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-2 z-50 text-xs">
                <div className="px-3 py-1.5 border-b border-slate-800">
                  <span className="block font-bold text-white truncate">@{currentUsername}</span>
                  <span className="text-[10px] text-slate-400">Authenticated Administrator</span>
                </div>
                <button
                  onClick={() => {
                    onSelectView('account-security');
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 flex items-center gap-2"
                >
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Account & Security</span>
                </button>
                <button
                  onClick={() => {
                    onSelectView('settings');
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300"
                >
                  Theme Settings
                </button>
                <div className="border-t border-slate-800 my-1" />
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    if (onLogout) onLogout();
                    else onViewLiveSite();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-rose-400 font-semibold flex items-center gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN ADMIN WORKSPACE (Sidebar + Content Canvas)                           */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`hidden md:flex flex-col bg-slate-900 text-slate-300 transition-all duration-200 border-r border-slate-800 shrink-0 ${
            sidebarCollapsed ? 'w-16' : 'w-56'
          }`}
        >
          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id as AdminView)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all relative ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className={`${isActive ? 'text-white' : 'text-slate-400'}`}>{item.icon}</span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  {!sidebarCollapsed && item.badge && (
                    <span className="ml-auto bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Collapse Toggle Footer */}
          <div className="p-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-40 md:hidden bg-slate-950/70 backdrop-blur-xs flex">
            <div className="w-64 bg-slate-900 text-white h-full p-4 flex flex-col space-y-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-sm">AstroPress Admin</span>
                <button onClick={() => setMobileDrawerOpen(false)} className="text-slate-400">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectView(item.id as AdminView);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                      currentView === item.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
          </div>
        )}

        {/* CONTENT CANVAS */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100">{children}</main>
      </div>
    </div>
  );
};
