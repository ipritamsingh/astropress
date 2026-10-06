import React from 'react';
import { Post, Category, Tag } from '../../types/cms';
import { PostCardImage } from '../common/PostCardImage';
import { ArrowLeft, Clock, ArrowRight, FolderTree, Tag as TagIcon } from 'lucide-react';

interface Props {
  type: 'category' | 'tag';
  item: Category | Tag;
  posts: Post[];
  onBack: () => void;
  onSelectPost: (post: Post) => void;
}

export const ArchiveView: React.FC<Props> = ({
  type,
  item,
  posts,
  onBack,
  onSelectPost,
}) => {
  const isCategory = type === 'category';
  const categoryItem = item as Category;

  const filteredPosts = posts.filter((p) => {
    if (p.status !== 'published') return false;
    if (isCategory) {
      const pCat = (p.category || '').trim().toLowerCase();
      const iName = (item.name || '').trim().toLowerCase();
      const iSlug = ((item as Category).slug || '').trim().toLowerCase();
      const iId = (item.id || '').trim().toLowerCase();
      return pCat === iName || pCat === iSlug || pCat === iId;
    }
    const pTags = (p.tags || []).map((t) => (t || '').trim().toLowerCase());
    const iName = (item.name || '').trim().toLowerCase();
    return pTags.includes(iName);
  });

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 font-sans">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </button>

      {/* Archive Header Banner */}
      <header className="mb-10 pb-6 border-b border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
          {isCategory ? <FolderTree className="h-4 w-4" /> : <TagIcon className="h-4 w-4" />}
          <span>{isCategory ? 'Category Archive' : 'Tag Archive'}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-serif-custom">
          {item.name}
        </h1>
        {isCategory && categoryItem.description && (
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            {categoryItem.description}
          </p>
        )}
        <span className="text-xs text-slate-400 block pt-1">
          {filteredPosts.length} published {filteredPosts.length === 1 ? 'article' : 'articles'}
        </span>
      </header>

      {/* Articles Grid */}
      {filteredPosts.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-sm">No published articles found in this archive.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectPost(post)}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="aspect-16/10 w-full rounded-xl overflow-hidden bg-slate-100 relative shrink-0">
                  <PostCardImage
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    fallbackCategory={post.category}
                  />
                  <span className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs">
                    {post.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{new Date(post.pubDate).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readingTime} min
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>By {post.author}</span>
                <span className="text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Read <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
