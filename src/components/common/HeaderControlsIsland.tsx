import React, { useState } from 'react';
import { Search, Menu as MenuIcon, X } from 'lucide-react';
import { SearchModal } from '../frontend/SearchModal';
import { Post, Page, Category, MenuItem } from '../../types/cms';

interface Props {
  showSearch?: boolean;
  menuItems?: MenuItem[];
  posts?: Post[];
  pages?: Page[];
  categories?: Category[];
}

export const HeaderControlsIsland: React.FC<Props> = ({
  showSearch = true,
  menuItems = [],
  posts = [],
  pages = [],
  categories = [],
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSelectPost = (post: Post) => {
    setIsSearchOpen(false);
    window.location.href = `/posts/${post.slug || post.id}/`;
  };

  const handleSelectPage = (page: Page) => {
    setIsSearchOpen(false);
    window.location.href = `/${page.slug || page.id}/`;
  };

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3">
        {showSearch && (
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-semibold cursor-pointer"
            title="Search Content (Ctrl+K)"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded">
              /
            </kbd>
          </button>
        )}

        {/* Mobile Burger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150 z-50">
          {menuItems.map((item) => (
            <a
              key={item.id}
              href={item.url}
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}

      {/* Interactive Search Modal */}
      {isSearchOpen && (
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          posts={posts}
          pages={pages}
          categories={categories}
          onSelectPost={handleSelectPost}
          onSelectPage={handleSelectPage}
        />
      )}
    </>
  );
};
