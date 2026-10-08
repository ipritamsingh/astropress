import React from 'react';
import { ArchiveView } from './ArchiveView';
import { Post, Category, Tag } from '../../types/cms';

interface WrapperProps {
  type: 'category' | 'tag';
  item: Category | Tag;
  posts: Post[];
  permalinkStructure?: string;
}

export const ArchiveViewWrapper: React.FC<WrapperProps> = (props) => {
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

  const handleBack = () => {
    window.location.href = '/';
  };

  const handleSelectPost = (post: Post) => {
    window.location.href = getPostPermalink(post);
  };

  return (
    <ArchiveView
      {...props}
      onBack={handleBack}
      onSelectPost={handleSelectPost}
    />
  );
};
