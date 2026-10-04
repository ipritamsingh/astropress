import React, { useState } from 'react';
import { Comment } from '../../types/cms';
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Reply,
  Send,
  CornerDownRight,
} from 'lucide-react';

interface Props {
  comments: Comment[];
  onUpdateStatus: (id: string, status: Comment['status']) => void;
  onAddReply: (commentId: string, replyText: string) => void;
}

export const CommentsManager: React.FC<Props> = ({ comments, onUpdateStatus, onAddReply }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'spam' | 'trash'>('all');
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const filteredComments = comments.filter((c) => {
    if (activeTab === 'all') return c.status !== 'trash';
    return c.status === activeTab;
  });

  const handleReplySubmit = (commentId: string) => {
    if (!replyText.trim()) return;
    onAddReply(commentId, replyText);
    setReplyText('');
    setReplyingCommentId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Comments Moderation</span>
          <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Moderate audience feedback, discussions, and spam filters</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 text-xs font-semibold border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`transition-colors ${
            activeTab === 'all' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          All ({comments.filter((c) => c.status !== 'trash').length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`transition-colors ${
            activeTab === 'pending' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Pending ({comments.filter((c) => c.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`transition-colors ${
            activeTab === 'approved' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Approved ({comments.filter((c) => c.status === 'approved').length})
        </button>
        <button
          onClick={() => setActiveTab('spam')}
          className={`transition-colors ${
            activeTab === 'spam' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Spam ({comments.filter((c) => c.status === 'spam').length})
        </button>
        <button
          onClick={() => setActiveTab('trash')}
          className={`transition-colors ${
            activeTab === 'trash' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 -mb-2' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Trash ({comments.filter((c) => c.status === 'trash').length})
        </button>
      </div>

      {/* Comments List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {filteredComments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No comments found in this view.
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div key={comment.id} className="p-5 space-y-3 hover:bg-slate-50/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img
                    src={comment.authorAvatar}
                    alt={comment.authorName}
                    className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900">{comment.authorName}</span>
                    <span className="text-[11px] text-slate-400 block sm:inline sm:ml-2">
                      on <span className="font-semibold text-slate-700">{comment.postTitle}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      comment.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : comment.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {comment.status}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(comment.date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-12">
                {comment.content}
              </p>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-12 pl-4 border-l-2 border-slate-200 space-y-2 py-1">
                  {comment.replies.map((rep) => (
                    <div key={rep.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-blue-600 mb-0.5">
                        <CornerDownRight className="h-3 w-3" />
                        <span>{rep.authorName}</span>
                      </div>
                      <p className="text-slate-600">{rep.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Reply Form */}
              {replyingCommentId === comment.id && (
                <div className="ml-12 mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write an administrative reply..."
                    className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200 outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setReplyingCommentId(null)}
                      className="px-3 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReplySubmit(comment.id)}
                      className="px-3 py-1 rounded-lg text-xs bg-blue-600 text-white font-bold flex items-center gap-1"
                    >
                      <Send className="h-3 w-3" />
                      <span>Post Reply</span>
                    </button>
                  </div>
                </div>
              )}

              {/* WordPress Row Action Buttons */}
              <div className="pl-12 flex flex-wrap items-center gap-3 text-xs pt-1">
                {comment.status !== 'approved' && (
                  <button
                    onClick={() => onUpdateStatus(comment.id, 'approved')}
                    className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                )}
                {comment.status === 'approved' && (
                  <button
                    onClick={() => onUpdateStatus(comment.id, 'pending')}
                    className="text-amber-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Unapprove</span>
                  </button>
                )}
                <button
                  onClick={() => setReplyingCommentId(replyingCommentId === comment.id ? null : comment.id)}
                  className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  <Reply className="h-3.5 w-3.5" />
                  <span>Reply</span>
                </button>
                {comment.status !== 'spam' && (
                  <button
                    onClick={() => onUpdateStatus(comment.id, 'spam')}
                    className="text-orange-600 hover:underline flex items-center gap-1"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Spam</span>
                  </button>
                )}
                <button
                  onClick={() => onUpdateStatus(comment.id, 'trash')}
                  className="text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Trash</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
