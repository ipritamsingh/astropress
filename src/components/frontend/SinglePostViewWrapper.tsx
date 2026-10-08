import React, { useState } from 'react';
import { SinglePostView } from './SinglePostView';
import { Post, Comment, Author } from '../../types/cms';

interface WrapperProps {
  post: Post;
  allPosts: Post[];
  comments: Comment[];
  authors: Author[];
  permalinkStructure?: string;
}

export const SinglePostViewWrapper: React.FC<WrapperProps> = (props) => {
  const [comments, setComments] = useState<Comment[]>(props.comments);

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

  const handleEditPost = (post: Post) => {
    window.location.href = `/wpadmin/?editPost=${post.id}`;
  };

  const handleSelectPost = (post: Post) => {
    window.location.href = getPostPermalink(post);
  };

  const handleAddComment = (comment: Comment) => {
    setComments((prev) => [...prev, comment]);
    fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment),
    }).catch(() => {});
  };

  return (
    <SinglePostView
      {...props}
      comments={comments}
      onBack={handleBack}
      onEditPost={handleEditPost}
      onSelectPost={handleSelectPost}
      onAddComment={handleAddComment}
    />
  );
};
