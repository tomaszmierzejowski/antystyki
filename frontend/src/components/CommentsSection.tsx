import React, { useState, useEffect } from 'react';
import type { Comment, CommentListResponse, CreateCommentRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import commentsApi from '../api/comments';
import AdminActions from './AdminActions';

interface Props {
  antisticId: string;
  commentsCount: number;
  onCommentsCountChange?: (count: number) => void;
  autoLoad?: boolean;
}

const CommentsSection: React.FC<Props> = ({ 
  antisticId, 
  commentsCount, 
  onCommentsCountChange,
  autoLoad = true
}) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(commentsCount);
  const [hasMore, setHasMore] = useState(true);

  const loadComments = async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      const response: CommentListResponse = await commentsApi.getComments(antisticId, pageNum, 10);
      
      if (append) {
        setComments(prev => [...prev, ...response.items]);
      } else {
        setComments(response.items);
      }
      
      setTotalCount(response.totalCount);
      setHasMore(response.items.length === 10);
      setPage(pageNum);
      
      if (onCommentsCountChange) {
        onCommentsCountChange(response.totalCount);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      const request: CreateCommentRequest = { content: newComment.trim() };
      const comment = await commentsApi.createComment(antisticId, request);
      
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      setTotalCount(prev => prev + 1);
      
      if (onCommentsCountChange) {
        onCommentsCountChange(totalCount + 1);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsApi.deleteComment(antisticId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setTotalCount(prev => prev - 1);
      
      if (onCommentsCountChange) {
        onCommentsCountChange(totalCount - 1);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  // Auto-load comments when component mounts
  useEffect(() => {
    if (autoLoad && comments.length === 0) {
      loadComments(1, false);
    }
  }, [autoLoad]);

  const handleLoadMore = () => {
    loadComments(page + 1, true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="mt-6 border-t border-gray-200 pt-4 bg-gray-50 -mx-6 px-6 pb-6">

      {/* Comments Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800">Discussion</h4>
            <p className="text-xs text-gray-500">{totalCount} {totalCount === 1 ? 'comment' : 'comments'}</p>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {/* Comment Composer */}
        {isAuthenticated ? (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 border border-gray-200 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                maxLength={2000}
                disabled={submitting}
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-500">
                  {newComment.length}/2000 characters
                </span>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
        ) : (
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm text-center">
              <p className="text-gray-600 mb-3">
                Please <a href="/login" className="text-blue-600 hover:underline font-medium">sign in</a> to comment.
              </p>
            </div>
        )}

        {/* Comments List */}
        {loading && comments.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        ) : (
          <>
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {comment.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{comment.user.username}</span>
                        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                        <div className="ml-auto flex items-center gap-2">
                          {user?.id === comment.user.id && (
                            <button
                              onClick={() => handleDelete(comment.id)}
                              className="text-xs text-red-600 hover:text-red-800 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                          <AdminActions 
                            antisticId={antisticId}
                            commentId={comment.id}
                            type="comment"
                            onAction={() => {
                              // Refresh comments after admin action
                              setComments(prev => prev.filter(c => c.id !== comment.id));
                              onCommentsCountChange?.(commentsCount - 1);
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed break-words">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md"
                  >
                    {loading ? 'Loading...' : 'Load more comments'}
                  </button>
                </div>
              )}

              {comments.length === 0 && !loading && (
                <div className="bg-white rounded-lg p-8 text-center border border-gray-200 shadow-sm">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
