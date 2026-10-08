import React, { useState } from 'react';
import { Post, Category, Author } from '../../types/cms';
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Copy,
  Trash2,
  Eye,
  ExternalLink,
  Calendar,
  User,
  FolderTree,
  Tag as TagIcon,
  CheckSquare,
  Square,
  Clock,
  Sparkles,
} from 'lucide-react';

interface Props {
  posts: Post[];
  categories: Category[];
  authors: Author[];
  onNewPost: () => void;
  onEditPost: (post: Post) => void;
  onDeletePost: (id: string) => void;
  onRestorePost: (id: string) => void;
  onPermanentlyDeletePost: (id: string) => void;
  onDuplicatePost: (id: string) => void;
  onViewPost: (post: Post) => void;
}

export const PostsManager: React.FC<Props> = ({
  posts,
  categories,
  authors,
  onNewPost,
  onEditPost,
  onDeletePost,
  onRestorePost,
  onPermanentlyDeletePost,
  onDuplicatePost,
  onViewPost,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'trash'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title' | 'views'>('date-desc');
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  // Filter posts
  let filtered = posts.filter((p) => {
    if (activeTab === 'published' && p.status !== 'published') return false;
    if (activeTab === 'draft' && p.status !== 'draft') return false;
    if (activeTab === 'trash' && p.status !== 'trash') return false;
    // Active tabs (all, published, draft) should exclude trashed posts
    if (activeTab !== 'trash' && p.status === 'trash') return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (selectedAuthor !== 'all' && p.author !== selectedAuthor) return false;
    if (
      searchQuery &&
      !p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Sort posts
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    if (sortBy === 'date-asc') return new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime();
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
    return 0;
  });

  const toggleSelectAll = () => {
    if (selectedPostIds.length === filtered.length) {
      setSelectedPostIds([]);
    } else {
      setSelectedPostIds(filtered.map((p) => p.id));
    }
  };

  const toggleSelectPost = (id: string) => {
    if (selectedPostIds.includes(id)) {
      setSelectedPostIds(selectedPostIds.filter((pid) => pid !== id));
    } else {
      setSelectedPostIds([...selectedPostIds, id]);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Move ${selectedPostIds.length} posts to trash?`)) {
      selectedPostIds.forEach((id) => onDeletePost(id));
      setSelectedPostIds([]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Title and Add New button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Posts</span>
            <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
              {posts.length}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage articles, blog dispatches, and architecture guides</p>
        </div>

        <button
          onClick={onNewPost}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Post</span>
        </button>
      </div>

      {/* WordPress-Style Tabs: All | Published | Drafts */}
      <div className="flex items-center gap-4 text-xs font-semibold border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`transition-colors ${
            activeTab === 'all' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          All ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('published')}
          className={`transition-colors ${
            activeTab === 'published' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Published ({posts.filter((p) => p.status === 'published').length})
        </button>
        <button
          onClick={() => setActiveTab('draft')}
          className={`transition-colors ${
            activeTab === 'draft' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Drafts ({posts.filter((p) => p.status === 'draft').length})
        </button>
        <button
          onClick={() => setActiveTab('trash')}
          className={`transition-colors ${
            activeTab === 'trash' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Trash ({posts.filter((p) => p.status === 'trash').length})
        </button>
      </div>

      {/* Trash View */}
      {activeTab === 'trash' && posts.filter(p => p.status === 'trash').length === 0 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
            <h3 className="text-lg font-bold text-slate-900">Trash is empty</h3>
            <p className="text-slate-500 text-xs mt-1">Deleted posts will remain here for 30 days before being permanently removed.</p>
        </div>
      )}

      {/* Filter and Search Bar */}
      {activeTab !== 'trash' && (
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Author Filter */}
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
          >
            <option value="all">All Authors</option>
            {authors.map((a) => (
              <option key={a.id} value={a.name}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="title">Title A-Z</option>
            <option value="views">Most Viewed</option>
          </select>

          {selectedPostIds.length > 0 && (
            <button
              onClick={() => {
                selectedPostIds.forEach(id => onDeletePost(id));
                setSelectedPostIds([]);
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold border border-rose-200 transition-colors"
            >
              Delete Selected ({selectedPostIds.length})
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-blue-500"
          />
        </div>
      </div>
      )}

      {/* Posts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-700">
                    {selectedPostIds.length === filtered.length && filtered.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Author</th>
                <th className="p-3.5">Categories</th>
                <th className="p-3.5">Tags</th>
                <th className="p-3.5">{activeTab === 'trash' ? 'Deleted' : 'Status'}</th>
                <th className="p-3.5">{activeTab === 'trash' ? 'Remaining' : 'Date'}</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No posts found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((post) => {
                  const isSelected = selectedPostIds.includes(post.id);

                  return (
                    <tr
                      key={post.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isSelected ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => toggleSelectPost(post.id)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      <td className="p-3.5 font-medium text-slate-900 min-w-[280px]">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                            <img
                              src={
                                post.featuredImage ||
                                'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=100&q=80'
                              }
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span
                              onClick={() => onEditPost(post)}
                              className="font-bold text-sm text-slate-900 hover:text-blue-600 cursor-pointer block line-clamp-1"
                            >
                              {post.title}
                            </span>
                            {/* WordPress row action links on hover */}
                            <div className="flex items-center gap-2 mt-1 text-[11px]">
                              <button
                                onClick={() => onEditPost(post)}
                                className="text-blue-600 hover:underline font-semibold"
                              >
                                Edit
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                onClick={() => onDuplicatePost(post.id)}
                                className="text-slate-600 hover:text-slate-900 hover:underline"
                              >
                                Duplicate
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                onClick={() => onViewPost(post)}
                                className="text-slate-600 hover:text-slate-900 hover:underline"
                              >
                                View
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                onClick={() => onDeletePost(post.id)}
                                className="text-rose-600 hover:underline"
                              >
                                Trash
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap font-medium text-slate-700">
                        {post.author}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-100">
                          {post.category}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {post.tags.slice(0, 2).map((t) => (
                            <span key={t} className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                          {post.tags.length > 2 && (
                            <span className="text-[10px] text-slate-400">+{post.tags.length - 2}</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        {activeTab === 'trash' ? (
                            <span className="text-slate-500 text-[11px]">
                                {post.deletedAt ? new Date(post.deletedAt).toLocaleDateString() : 'N/A'}
                            </span>
                        ) : (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            post.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {post.status}
                        </span>
                        )}
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                        {activeTab === 'trash' ? (
                           (() => {
                               if (!post.deletedAt) return 'N/A';
                               const deletedDate = new Date(post.deletedAt);
                               const expiryDate = new Date(deletedDate);
                               expiryDate.setDate(expiryDate.getDate() + 30);
                               const diffTime = expiryDate.getTime() - new Date().getTime();
                               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                               return diffDays <= 0 ? 'Expired' : (diffDays < 1 ? 'Less than 1 day' : `${diffDays} days remaining`);
                           })()
                        ) : (
                            new Date(post.pubDate).toLocaleDateString()
                        )}
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {activeTab === 'trash' ? (
                            <>
                                <button
                                    onClick={() => onRestorePost(post.id)}
                                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold border border-blue-200 transition-colors"
                                >
                                    Restore
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm("Are you sure you want to permanently delete this post? This action cannot be undone.")) {
                                            onPermanentlyDeletePost(post.id);
                                        }
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold border border-rose-200 transition-colors"
                                >
                                    Delete Permanently
                                </button>
                            </>
                          ) : (
                            <>
                                <button
                                    onClick={() => onEditPost(post)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                                    title="Edit Post"
                                >
                                    <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => onViewPost(post)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                                    title="View on Website"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
