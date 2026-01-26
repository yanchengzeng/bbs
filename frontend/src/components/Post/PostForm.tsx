import { useState } from 'react';
import { useCreatePost } from '../../hooks/usePosts';
import { useTags, useInvalidateTags } from '../../hooks/useTags';

export function PostForm() {
  const createPost = useCreatePost();
  const { data: availableTags = [], isLoading: tagsLoading } = useTags();
  const invalidateTags = useInvalidateTags();
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAddTag = () => {
    if (newTag.trim() && !newTag.trim().startsWith('#')) {
      const tagWithHash = `#${newTag.trim()}`;
      if (!selectedTags.includes(tagWithHash)) {
        setSelectedTags(prev => [...prev, tagWithHash]);
        setNewTag('');
        setShowAddTag(false);
      }
    } else if (newTag.trim().startsWith('#')) {
      const tag = newTag.trim();
      if (!selectedTags.includes(tag)) {
        setSelectedTags(prev => [...prev, tag]);
        setNewTag('');
        setShowAddTag(false);
      }
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      const postData: { content: string; tags?: string[] } = {
        content: content.trim(),
        tags: selectedTags.length > 0 ? selectedTags : undefined
      };
      
      createPost.mutate(
        postData,
        { onSuccess: () => {
          setContent('');
          setSelectedTags([]);
          setShowAddTag(false);
          setNewTag('');
          // Invalidate tags to refresh the list with newly created tags
          invalidateTags();
        }}
      );
    }
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg shadow-sm p-2">
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What did you just do?"
            className="w-full p-2 border border-zinc-600 rounded-lg bg-zinc-900 text-white placeholder-zinc-500 resize-none text-xs focus:outline-none focus:ring-2 focus:ring-zinc-500"
            rows={1}
          />
          {/* Tag Selection - Compact */}
          <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
            {tagsLoading ? (
              <span className="text-xs text-zinc-500">Loading tags...</span>
            ) : (
              <>
                {/* Show all available tags from API */}
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-white text-zinc-900'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {/* Show selected tags that aren't in availableTags (newly created tags) */}
                {selectedTags.filter(t => !availableTags.includes(t)).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className="px-2 py-0.5 rounded-full text-xs font-medium transition-colors bg-white text-zinc-900"
                  >
                    {tag}
                  </button>
                ))}
              </>
            )}
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
                  placeholder="Tag"
                  className="px-1.5 py-0.5 border border-zinc-600 rounded text-xs w-20 bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-1.5 py-0.5 bg-white text-zinc-900 rounded text-xs hover:bg-zinc-200"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTag(false);
                    setNewTag('');
                  }}
                  className="px-1.5 py-0.5 bg-zinc-700 text-zinc-300 rounded text-xs hover:bg-zinc-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddTag(true)}
                className="px-2 py-0.5 rounded-full text-xs font-medium transition-colors bg-zinc-700 text-zinc-300 hover:bg-zinc-600 border border-zinc-600"
              >
                + Tag
              </button>
            )}
          </div>
          {createPost.isError && (
            <div className="mt-1 text-xs text-red-400">
              Error: {createPost.error?.message || 'Failed to post'}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!content.trim() || createPost.isPending}
          className="px-3 py-2 bg-zinc-700 text-zinc-100 rounded-lg hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap border border-zinc-600"
        >
          {createPost.isPending && (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-zinc-100"></div>
          )}
          {createPost.isPending ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  );
}
