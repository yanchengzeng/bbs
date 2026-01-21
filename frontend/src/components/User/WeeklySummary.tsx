import { useState } from 'react';
import { useWeeklySummary } from '../../hooks/usePosts';
import { PostCard } from '../Post/PostCard';

interface WeeklySummaryProps {
  userId: string;
}

export function WeeklySummary({ userId }: WeeklySummaryProps) {
  const { data: summary, isLoading } = useWeeklySummary(userId);
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  const toggleExpand = (tag: string) => {
    setExpandedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-600"></div>
      </div>
    );
  }

  if (!summary || summary.length === 0) {
    return (
      <div className="text-xs text-zinc-500 py-4">
        No activity this week
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {summary.map((item) => {
        const isExpanded = expandedTags.has(item.tag);
        return (
          <div key={item.tag} className="border border-zinc-200/70 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(item.tag)}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-zinc-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-900">
                  {item.tag === 'other' ? 'Other' : item.tag}
                </span>
                <span className="text-xs text-zinc-500">({item.count} posts)</span>
              </div>
              <span className="text-zinc-500 text-xs">
                {isExpanded ? '▼' : '▶'}
              </span>
            </button>
            {isExpanded && (
              <div className="border-t border-zinc-200/70 p-3 space-y-3 bg-zinc-50">
                {item.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
