import { useState } from 'react';
import { useWeeklyReports } from '../../hooks/usePosts';
import { PostCard } from '../Post/PostCard';
import { format, parseISO } from 'date-fns';

interface WeeklyReportProps {
  userId: string;
}

export function WeeklyReport({ userId }: WeeklyReportProps) {
  const { data: reports, isLoading } = useWeeklyReports(userId);
  const [expandedCategories, setExpandedCategories] = useState<Map<string, Set<string>>>(new Map());

  const toggleCategory = (weekKey: string, tag: string) => {
    setExpandedCategories(prev => {
      const newMap = new Map(prev);
      const weekSet = newMap.get(weekKey) || new Set();
      const newSet = new Set(weekSet);
      
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      
      newMap.set(weekKey, newSet);
      return newMap;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-600"></div>
        <span className="ml-3 text-sm text-zinc-500">Loading reports...</span>
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="text-center text-sm text-zinc-400 py-12">
        No weekly reports available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reports.map((report) => {
        const weekKey = `${report.week_start}_${report.week_end}`;
        const expandedSet = expandedCategories.get(weekKey) || new Set();
        
        return (
          <div key={weekKey} className="bg-zinc-800 border border-zinc-700 rounded-2xl shadow-sm p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {format(parseISO(report.week_start), 'MMM dd')} - {format(parseISO(report.week_end), 'MMM dd, yyyy')}
            </h3>
            
            <div className="space-y-2">
              {(() => {
                // Sort categories: alphabetically but keep "other" at the bottom
                const sortedCategories = [...report.categories].sort((a, b) => {
                  if (a.tag === 'other') return 1;
                  if (b.tag === 'other') return -1;
                  return a.tag.localeCompare(b.tag);
                });
                
                return sortedCategories.map((category) => {
                  const isExpanded = expandedSet.has(category.tag);
                  return (
                    <div key={category.tag} className="border border-zinc-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleCategory(weekKey, category.tag)}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-zinc-700 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {category.tag === 'other' ? 'Other' : category.tag}
                          </span>
                          <span className="text-xs text-zinc-400">({category.count} posts)</span>
                        </div>
                        <span className="text-zinc-400 text-xs">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-zinc-700 p-3 space-y-3 bg-zinc-900">
                          {category.posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
