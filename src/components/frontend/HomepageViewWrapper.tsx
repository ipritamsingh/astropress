import React from 'react';
import { HomepageView } from './HomepageView';
import { Post, Category, HomepageSection, HeroSectionConfig, ThemeSettings } from '../../types/cms';

interface WrapperProps {
  posts: Post[];
  categories: Category[];
  sections: HomepageSection[];
  heroConfig?: HeroSectionConfig;
  themeSettings: ThemeSettings;
  currentPage?: number;
  permalinkStructure?: string;
}

export const HomepageViewWrapper: React.FC<WrapperProps> = (props) => {
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

  const handleSelectPost = (post: Post) => {
    window.location.href = getPostPermalink(post);
  };

  const handleSelectCategory = (cat: Category) => {
    window.location.href = `/category/${cat.slug}/`;
  };

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <HomepageView
      {...props}
      onSelectPost={handleSelectPost}
      onSelectCategory={handleSelectCategory}
      onNavigate={handleNavigate}
    />
  );
};
