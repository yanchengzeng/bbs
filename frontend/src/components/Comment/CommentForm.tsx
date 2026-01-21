import { useState } from 'react';
import { useCreateComment } from '../../hooks/useComments';
import { useAuth } from '../../hooks/useAuth';

interface CommentFormProps {
  postId: string;
}

export function CommentForm({ postId }: CommentFormProps) {
  const { isAuthenticated } = useAuth();
  const createComment = useCreateComment();
  const [content, setContent] = useState('');
  const [anonymousName, setAnonymousName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(!isAuthenticated);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      const commentData: { content: string; anonymous_name?: string } = {
        content: content.trim()
      };
      
      if (isAnonymous && anonymousName.trim()) {
        commentData.anonymous_name = anonymousName.trim();
      }
      
      createComment.mutate(
        { postId, data: commentData },
        { onSuccess: () => {
          setContent('');
          setAnonymousName('');
        }}
      );
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="mt-3">
      {isAuthenticated && (
        <div className="mb-2 flex items-center gap-2">
          <input
            type="checkbox"
            id={`anonymous-comment-${postId}`}
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
          />
          <label htmlFor={`anonymous-comment-${postId}`} className="text-xs text-zinc-500">
            Comment as anonymous
          </label>
        </div>
      )}
      {isAnonymous && (
        <input
          type="text"
          value={anonymousName}
          onChange={(e) => setAnonymousName(e.target.value)}
          placeholder="Your name (optional, defaults to 'Anonymous')"
          className="w-full mb-2 p-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 placeholder-zinc-400 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      )}
      <div className="flex gap-2 items-end">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 p-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 placeholder-zinc-400 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
          rows={2}
        />
        <button
          type="submit"
          disabled={!content.trim() || createComment.isPending}
          className="px-3 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-xs font-medium whitespace-nowrap"
        >
          {createComment.isPending && (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
          )}
          {createComment.isPending ? '...' : 'Post'}
        </button>
      </div>
      {createComment.isError && (
        <div className="mt-2 text-xs text-red-600">
          Error: {createComment.error?.message || 'Failed to post comment'}
        </div>
      )}
    </form>
  );
}
