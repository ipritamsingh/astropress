import React, { useState } from 'react';
import { MessageSquare, Send, Check } from 'lucide-react';
import { Comment } from '../../types/cms';

interface Props {
  postId: string;
  postTitle: string;
  initialComments: Comment[];
}

export const CommentsIsland: React.FC<Props> = ({
  postId,
  postTitle,
  initialComments,
}) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSubmitted, setCommentSubmitted] = useState(false);

  const approvedComments = comments.filter((c) => c.status === 'approved');

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) return;

    const newComment: Comment = {
      id: 'comm-' + Date.now(),
      postId,
      postTitle,
      authorName: commentName.trim(),
      authorEmail: commentEmail.trim() || `${commentName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      authorAvatar: `https://images.unsplash.com/photo-${1535713875000 + (Date.now() % 500)}?auto=format&fit=crop&w=120&q=80`,
      content: commentText.trim(),
      date: new Date().toISOString(),
      status: 'approved',
    };

    setComments((prev) => [newComment, ...prev]);

    // Also persist to localStorage so it syncs with CMS if needed
    try {
      const stored = localStorage.getItem('astropress_cms_state_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.comments = [newComment, ...(parsed.comments || [])];
        localStorage.setItem('astropress_cms_state_v3', JSON.stringify(parsed));
      }
    } catch {}

    setCommentSubmitted(true);
    setCommentText('');
    setCommentName('');
    setCommentEmail('');
    setTimeout(() => setCommentSubmitted(false), 4000);
  };

  return (
    <section className="my-12 pt-8 border-t border-slate-200 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="text-xl font-bold text-slate-900">
            Discussion ({approvedComments.length})
          </h3>
        </div>
        <span className="text-xs text-slate-500">Real-time CMS moderation</span>
      </div>

      {/* Existing Comments List */}
      <div className="space-y-4">
        {approvedComments.length === 0 ? (
          <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-slate-100">
            No comments yet on this article. Be the first to start the conversation below!
          </p>
        ) : (
          approvedComments.map((comm) => (
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
                    <span className="block text-sm font-bold text-slate-900">
                      {comm.authorName}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {new Date(comm.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-normal pl-12">
                {comm.content}
              </p>

              {/* Nested Replies */}
              {comm.replies && comm.replies.length > 0 && (
                <div className="ml-12 pl-4 border-l-2 border-blue-200 space-y-3 pt-2">
                  {comm.replies.map((rep) => (
                    <div key={rep.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600">
                          {rep.authorName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rep.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{rep.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Leave a Comment Form */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
        <h4 className="text-base font-bold text-slate-900">Leave a Reply</h4>

        {commentSubmitted ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>Thank you! Your comment has been added to the discussion.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Alex Rivera"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email Address (optional)
                </label>
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={commentEmail}
                  onChange={(e) => setCommentEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Your Thoughts / Feedback *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Share your perspective, ask questions about the architecture, or discuss with the author..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500 transition-colors resize-y"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Comment</span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
