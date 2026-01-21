import type { Comment } from '../../hooks/usePosts';
import { UserAvatar } from '../User/UserAvatar';
import { formatTimestamp } from '../../utils/dateUtils';
import { Markdown } from '../../utils/markdown';
import { useAuth } from '../../hooks/useAuth';
import { useDeleteComment, useUpdateComment } from '../../hooks/useComments';
import { useState } from 'react';

interface CommentCardProps {
  comment: Comment;
}

export function CommentCard({ comment }: CommentCardProps) {
  const { user: currentUser } = useAuth();
  const deleteComment = useDeleteComment();
  const updateComment = useUpdateComment();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const isOwner = currentUser?.id === comment.user_id;
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteComment.mutate(comment.id);
    }
  };
  
  const handleUpdate = () => {
    updateComment.mutate(
      { commentId: comment.id, data: { content: editContent } },
      { onSuccess: () => setIsEditing(false) }
    );
  };
  
  const displayName = comment.user ? comment.user.name : (comment.anonymous_name || 'Anonymous');

  return (
    <div className="flex gap-2 py-2">
      {comment.user ? (
        <UserAvatar name={comment.user.name} avatarUrl={comment.user.avatar_url} size="sm" />
      ) : (
        <UserAvatar name={displayName} avatarUrl={null} size="sm" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-zinc-900">
            {displayName}
          </span>
          <span className="text-xs text-zinc-500">
            {formatTimestamp(comment.created_at)}
            {comment.is_edited && ' (edited)'}
          </span>
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-500"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="px-3 py-1 text-xs bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="px-3 py-1 text-xs bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm leading-relaxed text-zinc-900 whitespace-pre-wrap break-words mb-1">
              <Markdown content={comment.content} />
            </div>
            {isOwner && (
              <div className="flex gap-3 text-xs">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-zinc-500 hover:text-zinc-700"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
