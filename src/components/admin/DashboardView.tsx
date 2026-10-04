import React, { useState } from 'react';
import { Post, Page, Category, MediaItem, Comment, GitCommitRecord } from '../../types/cms';
import {
  FileText,
  Files,
  Image as ImageIcon,
  FolderTree,
  Eye,
  Edit3,
  Plus,
  TrendingUp,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Server,
  Zap,
  Globe,
  ArrowRight,
  GitCommit,
  Sparkles,
} from 'lucide-react';

interface Props {
  posts: Post[];
  pages: Page[];
  categories: Category[];
  media: MediaItem[];
  comments: Comment[];
  commitHistory: GitCommitRecord[];
  onNewPost: () => void;
  onNewPage: () => void;
  onEditPost: (post: Post) => void;
  onNavigateToView: (view: any) => void;
  onSaveQuickDraft: (title: string, content: string) => void;
}

export const DashboardView: React.FC<Props> = ({
  posts,
  pages,
  categories,
  media,
  comments,
  commitHistory,
  onNewPost,
  onNewPage,
  onEditPost,
  onNavigateToView,
  onSaveQuickDraft,
}) => {
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);

  const publishedPostsCount = posts.filter((p) => p.status === 'published').length;
  const draftPostsCount = posts.filter((p) => p.status === 'draft').length;
  const recentPosts = posts.slice(0, 5);

  const handleQuickDraftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle) return;
    onSaveQuickDraft(draftTitle, draftContent);
    setDraftSaved(true);
    setDraftTitle('');
    setDraftContent('');
    setTimeout(() => setDraftSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Sparkles className="h-4 w-4" />
            <span>Welcome to AstroPress CMS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            WordPress Familiarity • Astro Speed • Sveltia Simplicity
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Manage your content visually with our Gutenberg-inspired block editor, customizer, and media library.
            Every save is validated against Astro Content Collections schemas and committed directly to GitHub.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onNewPost}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Write New Post</span>
            </button>
            <button
              onClick={() => onNavigateToView('customizer')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md font-semibold text-xs text-white border border-white/10 transition-colors"
            >
              <span>Customize Site</span>
            </button>
            <button
              onClick={() => onNavigateToView('sveltia-native')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md font-semibold text-xs text-slate-200 border border-white/10 transition-colors"
            >
              <span>Open Native Sveltia</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Metric Widgets (WordPress "At a Glance") */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div
          onClick={() => onNavigateToView('posts')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Posts</span>
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{posts.length}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">{publishedPostsCount}</span> published
          </div>
        </div>

        <div
          onClick={() => onNavigateToView('posts')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Drafts</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{draftPostsCount}</div>
          <div className="text-[11px] text-slate-500">Unpublished</div>
        </div>

        <div
          onClick={() => onNavigateToView('pages')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pages</span>
            <Files className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{pages.length}</div>
          <div className="text-[11px] text-slate-500">Static templates</div>
        </div>

        <div
          onClick={() => onNavigateToView('categories')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Categories</span>
            <FolderTree className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{categories.length}</div>
          <div className="text-[11px] text-slate-500">Taxonomies</div>
        </div>

        <div
          onClick={() => onNavigateToView('media')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Media</span>
            <ImageIcon className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{media.length}</div>
          <div className="text-[11px] text-slate-500">Assets in Git</div>
        </div>

        <div
          onClick={() => onNavigateToView('comments')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Comments</span>
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{comments.length}</div>
          <div className="text-[11px] text-slate-500">Discussions</div>
        </div>
      </div>

      {/* Grid: Recent Posts Table & Quick Draft */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Posts List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Content Activity</h2>
              <span className="text-xs text-slate-500">Latest edited posts and publications</span>
            </div>
            <button
              onClick={() => onNavigateToView('posts')}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentPosts.map((post) => (
              <div key={post.id} className="py-3 flex items-center justify-between gap-4 group">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={
                        post.featuredImage ||
                        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=100&q=80'
                      }
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3
                      onClick={() => onEditPost(post)}
                      className="text-sm font-bold text-slate-800 hover:text-blue-600 cursor-pointer truncate"
                    >
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-medium text-slate-600">{post.category}</span>
                      <span>•</span>
                      <span>By {post.author}</span>
                      <span>•</span>
                      <span>{new Date(post.pubDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      post.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {post.status}
                  </span>
                  <button
                    onClick={() => onEditPost(post)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50"
                    title="Edit in Gutenberg Editor"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: WordPress Quick Draft */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Quick Draft</h3>
                <span className="text-xs text-slate-500">Jot down idea & save as draft</span>
              </div>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>

            {draftSaved && (
              <div className="p-3 mb-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Draft created! Available in Posts list.</span>
              </div>
            )}

            <form onSubmit={handleQuickDraftSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Draft story title..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">What's on your mind?</label>
                <textarea
                  rows={4}
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder="Outline paragraphs, key takeaways, links..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-slate-50/50 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Save Quick Draft
              </button>
            </form>
          </div>

          {/* Site Status / Health */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Website Architecture Health
            </span>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span>Astro Static Build</span>
                </span>
                <span className="font-bold text-emerald-600">Pre-rendered</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-blue-500" />
                  <span>Sveltia CMS Engine</span>
                </span>
                <span className="font-bold text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-orange-500" />
                  <span>Cloudflare Pages</span>
                </span>
                <span className="font-bold text-emerald-600">Edge Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Git Commit History / Audit Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent Git Commits (GitHub Repository Audit Log)</h3>
          </div>
          <button
            onClick={() => onNavigateToView('github-deployment')}
            className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
          >
            <span>GitHub & Deployment Details</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {commitHistory.slice(0, 4).map((c) => (
            <div key={c.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <code className="text-purple-600 font-mono bg-purple-50 px-1.5 py-0.5 rounded font-bold text-[11px]">
                  {c.id}
                </code>
                <span className="font-medium text-slate-800">{c.message}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                <span>{c.author.split('<')[0]}</span>
                <span>•</span>
                <span>{c.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
