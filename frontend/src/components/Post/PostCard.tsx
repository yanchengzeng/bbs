import type { Post } from '../../hooks/usePosts';
import { UserAvatar } from '../User/UserAvatar';
import { formatTimestamp } from '../../utils/dateUtils';
import { Markdown } from '../../utils/markdown';
import { useAuth } from '../../hooks/useAuth';
import { useDeletePost, useUpdatePost } from '../../hooks/usePosts';
import { useToggleLike } from '../../hooks/useLikes';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePostLikes } from '../../hooks/useLikes';

interface PostCardProps {
  post: Post;
}

const PRESET_TAGS = ['#gettingup', '#running', '#reading'];

export function PostCard({ post }: PostCardProps) {
  const { user: currentUser } = useAuth();
  const deletePost = useDeletePost();
  const updatePost = useUpdatePost();
  const toggleLike = useToggleLike();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editTags, setEditTags] = useState<string[]>(post.tags || []);
  const [showLikers, setShowLikers] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const { data: likersData } = usePostLikes(post.id, showLikers);
  const isOwner = currentUser && post.user_id && currentUser.id === post.user_id;
  
  // Update edit state when post changes
  useEffect(() => {
    setEditContent(post.content);
    setEditTags(post.tags || []);
  }, [post.content, post.tags]);
  
  const handleAddTag = () => {
    if (newTag.trim() && !newTag.trim().startsWith('#')) {
      const tagWithHash = `#${newTag.trim()}`;
      if (!editTags.includes(tagWithHash) && !PRESET_TAGS.includes(tagWithHash)) {
        setEditTags(prev => [...prev, tagWithHash]);
        setNewTag('');
        setShowAddTag(false);
      }
    } else if (newTag.trim().startsWith('#')) {
      const tag = newTag.trim();
      if (!editTags.includes(tag) && !PRESET_TAGS.includes(tag)) {
        setEditTags(prev => [...prev, tag]);
        setNewTag('');
        setShowAddTag(false);
      }
    }
  };
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this post?')) {
      deletePost.mutate(post.id);
    }
  };
  
  const handleUpdate = () => {
    updatePost.mutate(
      { postId: post.id, data: { content: editContent, tags: editTags } },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const handleTagClick = (tag: string) => {
    setEditTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  const displayName = post.user ? post.user.name : (post.anonymous_name || 'Anonymous');
  const isOwnPost = !!(currentUser && post.user_id && currentUser.id === post.user_id);

  /**
   * Avatar rules:
   * - If the post's user has an avatar_url, always show that image (even if it's not your post).
   * - Otherwise, only show initials for your own posts.
   * - Otherwise, show the default anonymous avatar.
   */
  const hasAvatarUrl = !!post.user?.avatar_url;
  const shouldShowUserAvatar = hasAvatarUrl || (isOwnPost && !!post.user);

  return (
    <article className="bg-zinc-800 border border-zinc-700 rounded-2xl shadow-sm p-3 sm:p-4">
      {/* Row 1: Avatar + Name + Timestamp */}
      <div className="flex items-center gap-2 mb-2">
        {shouldShowUserAvatar ? (
          <Link to={`/users/${post.user.id}`}>
            <UserAvatar name={post.user.name} avatarUrl={post.user.avatar_url} size="md" />
          </Link>
        ) : (
          <UserAvatar name="Anonymous" avatarUrl={null} size="md" />
        )}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {post.user ? (
            <Link
              to={`/users/${post.user.id}`}
              className="text-sm font-semibold text-white hover:text-zinc-300 truncate"
            >
              {post.user.name}
            </Link>
          ) : (
            <span className="text-sm font-semibold text-white truncate">
              {displayName}
            </span>
          )}
          <span className="text-xs text-zinc-400 whitespace-nowrap">
            {formatTimestamp(post.created_at)}
            {post.is_edited && ' (edited)'}
          </span>
          {/* Like button next to timestamp */}
          <div className="relative">
            <button
              onClick={() => toggleLike.mutate(post.id)}
              onMouseEnter={() => post.like_count > 0 && setShowLikers(true)}
              onMouseLeave={() => setShowLikers(false)}
              disabled={toggleLike.isPending}
              className={`flex items-center gap-1 ml-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                post.is_liked
                  ? 'text-red-500 hover:text-red-400'
                  : 'text-zinc-400 hover:text-red-500'
              }`}
            >
              <span className="text-sm">♥</span>
              <span className="text-xs">{post.like_count}</span>
            </button>
            {/* Hover tooltip showing users who liked */}
            {showLikers && likersData && likersData.users.length > 0 && (
              <div className="absolute left-0 top-full mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg p-2 z-10 min-w-[200px]">
                <div className="text-xs font-semibold text-zinc-300 mb-2">Liked by:</div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {likersData.users.map((user) => (
                    <div key={user.id} className="flex items-center gap-2 text-xs">
                      <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="sm" />
                      <span className="text-white">{user.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-zinc-400 hover:text-zinc-300"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="text-xs text-red-500 hover:text-red-400"
            >
              Delete
            </button>
          </div>
        )}
      </div>
      
      {/* Row 2: Body */}
      {isEditing ? (
        <div className="space-y-2 mb-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-3 border border-zinc-600 rounded-lg bg-zinc-900 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-500"
            rows={4}
          />
          {/* Tag Selection in Edit Mode */}
          <div className="flex flex-wrap gap-2 items-center">
            {PRESET_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  editTags.includes(tag)
                    ? 'bg-white text-zinc-900'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                {tag}
              </button>
            ))}
            {editTags.filter(t => !PRESET_TAGS.includes(t)).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors bg-white text-zinc-900"
              >
                {tag}
              </button>
            ))}
            {showAddTag ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    } else if (e.key === 'Escape') {
                      setShowAddTag(false);
                      setNewTag('');
                    }
                  }}
                  placeholder="Tag name"
                  className="px-2 py-1 border border-zinc-600 rounded text-xs w-24 bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-2 py-1 bg-white text-zinc-900 rounded text-xs hover:bg-zinc-200"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTag(false);
                    setNewTag('');
                  }}
                  className="px-2 py-1 bg-zinc-700 text-zinc-300 rounded text-xs hover:bg-zinc-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddTag(true)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors bg-zinc-700 text-zinc-300 hover:bg-zinc-600 border border-zinc-600"
              >
                + Add tag
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 text-sm transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(post.content);
                setEditTags(post.tags || []);
                setShowAddTag(false);
                setNewTag('');
              }}
              className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm leading-relaxed text-white whitespace-pre-wrap break-words mb-2">
            <Markdown content={post.content} />
          </div>
          {/* Display Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-zinc-700 text-zinc-300 rounded-full text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}
      
    </article>
  );
}
