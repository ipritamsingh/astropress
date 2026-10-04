import React, { useState, useEffect } from 'react';
import { Post, Page, Category } from '../../types/cms';
import { Search, X, ArrowRight, FileText, BookOpen, Hash } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  pages: Page[];
  categories: Category[];
  onSelectPost: (post: Post) => void;
  onSelectPage: (page: Page) => void;
}

export const SearchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  posts,
  pages,
  categories,
  onSelectPost,
  onSelectPage,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Handled by parent toggle if needed
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const normalized = query.toLowerCase().trim();

  const matchedPosts = query
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(normalized) ||
          p.excerpt.toLowerCase().includes(normalized) ||
          p.category.toLowerCase().includes(normalized) ||
          p.tags.some((t) => t.toLowerCase().includes(normalized))
      )
    : posts.slice(0, 4);

  const matchedPages = query
    ? pages.filter((p) => p.title.toLowerCase().includes(normalized))
    : pages.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4 font-sans animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stories, pages, topics, or keywords..."
            className="flex-1 text-sm sm:text-base text-slate-900 placeholder-slate-400 outline-none border-none bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded font-semibold border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
          {/* Posts Section */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Articles ({matchedPosts.length})</span>
              </span>
            </div>
            {matchedPosts.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-2">No matching stories found.</p>
            ) : (
              <div className="space-y-1.5">
                {matchedPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => {
                      onSelectPost(post);
                      onClose();
                    }}
                    className="p-3 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-blue-600 font-semibold mb-0.5">
                        <span>{post.category}</span>
                        <span>•</span>
                        <span>{post.readingTime} min</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h4>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0 ml-3" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pages Section */}
          {matchedPages.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                <FileText className="h-3.5 w-3.5" />
                <span>Pages</span>
              </div>
              <div className="space-y-1">
                {matchedPages.map((page) => (
                  <div
                    key={page.id}
                    onClick={() => {
                      onSelectPage(page);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                      {page.title}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">/{page.slug}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
