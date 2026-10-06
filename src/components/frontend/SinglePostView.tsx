import React, { useState, useEffect } from 'react';
import { Post, Comment, Author, Category } from '../../types/cms';
import { GutenbergBlockRenderer, parseMarkdownToBlocks } from '../common/GutenbergBlockRenderer';
import { getPersistedMediaBlob } from '../../data/mediaStorage';
import {
  Clock,
  User,
  Calendar,
  Share2,
  Bookmark,
  MessageSquare,
  ArrowLeft,
  Edit3,
  Check,
  Send,
  Twitter,
  Linkedin,
  Copy,
  ChevronRight,
} from 'lucide-react';

interface Props {
  post: Post;
  allPosts: Post[];
  comments: Comment[];
  authors: Author[];
  onBack: () => void;
  onEditPost: (post: Post) => void;
  onSelectPost: (post: Post) => void;
  onAddComment: (comment: Comment) => void;
}

export const SinglePostView: React.FC<Props> = ({
  post,
  allPosts,
  comments,
  authors,
  onBack,
  onEditPost,
  onSelectPost,
  onAddComment,
}) => {
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSubmitted, setCommentSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const postAuthor = authors.find((a) => a.name === post.author) || authors[0];
  const postComments = comments.filter((c) => c.postId === post.id && c.status === 'approved');
  const relatedPosts = allPosts
    .filter((p) => p.id !== post.id && (p.category === post.category || p.status === 'published'))
    .slice(0, 3);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName || !commentText) return;

    const newComment: Comment = {
      id: 'comm-' + Date.now(),
      postId: post.id,
      postTitle: post.title,
      authorName: commentName,
      authorEmail: commentEmail || `${commentName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      authorAvatar: `https://images.unsplash.com/photo-${1535713875000 + (Date.now() % 500)}?auto=format&fit=crop&w=120&q=80`,
      content: commentText,
      date: new Date().toISOString(),
      status: 'approved', // Auto-approved for instant satisfaction
    };

    onAddComment(newComment);
    setCommentSubmitted(true);
    setCommentText('');
    setCommentName('');
    setCommentEmail('');
    setTimeout(() => setCommentSubmitted(false), 4000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Automatic FAQPage JSON-LD Schema Generator
  const activeBlocks = (post.blocks && post.blocks.length > 0) ? post.blocks : parseMarkdownToBlocks(post.body || '');
  const faqBlocks = activeBlocks.filter(
    (b) => b.type === 'accordion' && b.settings?.accordionItems && b.settings.accordionItems.length > 0
  );
  const faqEntities: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }> = [];

  for (const block of faqBlocks) {
    for (const item of block.settings.accordionItems || []) {
      const q = item.title?.trim();
      const a = item.content?.trim();
      if (q && a) {
        faqEntities.push({
          '@type': 'Question',
          name: q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: a,
          },
        });
      }
    }
  }

  const faqJsonLd =
    faqEntities.length > 0
      ? JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqEntities,
        })
      : null;

  const articleJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.pubDate,
    dateModified: post.updatedDate || post.pubDate,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    image: post.featuredImage || undefined,
  });

  const [featuredImgSrc, setFeaturedImgSrc] = useState<string>(post.featuredImage || '');

  useEffect(() => {
    setFeaturedImgSrc(post.featuredImage || '');
    if (post.featuredImage && (post.featuredImage.startsWith('/uploads/') || post.featuredImage.startsWith('uploads/'))) {
      getPersistedMediaBlob(post.featuredImage).then((blob) => {
        if (blob) setFeaturedImgSrc(blob);
      }).catch(() => {});
    }
  }, [post.featuredImage]);

  return (
    <article className="max-w-4xl mx-auto py-8 px-4 sm:px-6 font-sans">
      {/* Schema.org Article Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: articleJsonLd }}
      />

      {/* Schema.org FAQPage Structured Data (Automatically generated when FAQ items present) */}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: faqJsonLd }}
        />
      )}
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
        <button onClick={onBack} className="hover:text-blue-600 transition-colors">
          Home
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-blue-600">{post.category}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-400 truncate max-w-[200px]">{post.title}</span>
      </nav>

      {/* Post Article Header */}
      <header className="space-y-4 pb-8 border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200/60">
            {post.category}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight font-serif-custom">
          {post.title}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-light">
          {post.excerpt}
        </p>

        {/* Metadata bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <img
              src={
                postAuthor?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
              }
              alt={post.author}
              className="h-11 w-11 rounded-full object-cover ring-2 ring-slate-100 shadow-2xs"
            />
            <div>
              <span className="block text-sm font-bold text-slate-900">{post.author}</span>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>
                  {new Date(post.pubDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readingTime} min read
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold"
              title="Copy Story Link"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Featured Cover Image */}
      {post.featuredImage && (
        <div className="my-8 rounded-2xl overflow-hidden bg-slate-100 shadow-md border border-slate-200">
          <img
            src={featuredImgSrc || post.featuredImage}
            alt={post.title}
            className="w-full h-auto object-cover max-h-[500px]"
            onError={async () => {
              if (post.featuredImage) {
                const fallback = await getPersistedMediaBlob(post.featuredImage);
                if (fallback) setFeaturedImgSrc(fallback);
              }
            }}
          />
        </div>
      )}

      {/* Body Content & Rendered Gutenberg Blocks */}
      <div className="py-6">
        <GutenbergBlockRenderer blocks={post.blocks} rawMarkdown={post.body} />
      </div>

      {/* Tags Section */}
      {post.tags && post.tags.length > 0 && (
        <div className="pt-6 pb-8 border-t border-slate-200 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Filed Under:</span>
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Author Bio Box */}
      <div className="my-8 p-6 rounded-2xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <img
          src={
            postAuthor?.avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
          }
          alt={post.author}
          className="h-16 w-16 rounded-full object-cover ring-2 ring-blue-500/20 shadow-xs shrink-0"
        />
        <div className="text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h4 className="font-bold text-slate-900 text-base">{postAuthor?.name || post.author}</h4>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
              {postAuthor?.role || 'Staff Architect'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {postAuthor?.bio ||
              'Software engineer and publishing architect specializing in Astro, headless CMS patterns, and edge deployment infrastructures.'}
          </p>
        </div>
      </div>

      {/* Comments Moderation / Interaction Section */}
      <section className="my-12 pt-8 border-t border-slate-200 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h3 className="text-xl font-bold text-slate-900">
              Discussion ({postComments.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">Real-time CMS moderation</span>
        </div>

        {/* Existing Comments List */}
        <div className="space-y-4">
          {postComments.length === 0 ? (
            <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-slate-100">
              No comments yet on this article. Be the first to start the conversation below!
            </p>
          ) : (
            postComments.map((comm) => (
              <div
                key={comm.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={comm.authorAvatar}
                      alt={comm.authorName}
                      className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">{comm.authorName}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(comm.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200/50">
                    Approved
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed pl-12">{comm.content}</p>

                {/* Nested Replies */}
                {comm.replies && comm.replies.length > 0 && (
                  <div className="ml-12 mt-3 space-y-2 pt-3 border-t border-slate-100">
                    {comm.replies.map((rep) => (
                      <div key={rep.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                        <span className="font-bold text-blue-600 block mb-0.5">{rep.authorName}</span>
                        <p className="text-slate-600">{rep.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Leave a Comment Form */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
          <h4 className="font-bold text-slate-900 text-sm">Leave a Thoughtful Reply</h4>
          {commentSubmitted ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Thank you! Your comment has been posted and stored in the CMS.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  placeholder="Your Name *"
                  className="px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500"
                />
                <input
                  type="email"
                  value={commentEmail}
                  onChange={(e) => setCommentEmail(e.target.value)}
                  placeholder="Email Address (optional)"
                  className="px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500"
                />
              </div>
              <textarea
                required
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write your constructive thoughts..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Post Comment</span>
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="my-12 pt-8 border-t border-slate-200 space-y-4">
          <h3 className="text-xl font-bold text-slate-900">Recommended Reading</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedPosts.map((rel) => (
              <div
                key={rel.id}
                onClick={() => onSelectPost(rel)}
                className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-xs transition-all space-y-2"
              >
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  {rel.category}
                </span>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {rel.title}
                </h4>
                <span className="text-[11px] text-slate-400 block">{rel.readingTime} min read</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};
