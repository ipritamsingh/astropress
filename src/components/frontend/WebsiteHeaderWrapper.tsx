import React, { useState } from 'react';
import { WebsiteHeader } from './WebsiteHeader';
import { SearchModal } from './SearchModal';
import { ThemeSettings, Menu, Post, Page, Category } from '../../types/cms';

interface WrapperProps {
  themeSettings: ThemeSettings;
  menus: Menu[];
  posts: Post[];
  pages: Page[];
  categories: Category[];
  permalinkStructure?: string;
}

export const WebsiteHeaderWrapper: React.FC<WrapperProps> = (props) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const getPostPermalink = (post: Post) => {
    const permalinkStruct = props.permalinkStructure || '/%postname%/';
    const cleanSlug = (post.slug || '').replace(/^\//, '');
    if (permalinkStruct === '/posts/%postname%/') {
      return `/posts/${cleanSlug}/`;
    } else if (permalinkStruct === '/%year%/%month%/%day%/%postname%/') {
      const d = new Date(post.pubDate || Date.now());
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `/${year}/${month}/${day}/${cleanSlug}/`;
    } else if (permalinkStruct === '/archives/%post_id%/') {
      return `/archives/${post.id}/`;
    } else {
      return `/${cleanSlug}/`;
    }
  };

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  const handleSelectPost = (post: Post) => {
    setIsSearchOpen(false);
    window.location.href = getPostPermalink(post);
  };

  const handleSelectPage = (page: Page) => {
    setIsSearchOpen(false);
    const cleanSlug = page.slug.replace(/^\//, '');
    window.location.href = `/${cleanSlug}/`;
  };

  return (
    <>
      <WebsiteHeader
        themeSettings={props.themeSettings}
        menus={props.menus}
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigate={handleNavigate}
      />
      {isSearchOpen && (
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          posts={props.posts}
          pages={props.pages}
          categories={props.categories}
          onSelectPost={handleSelectPost}
          onSelectPage={handleSelectPage}
        />
      )}
    </>
  );
};
