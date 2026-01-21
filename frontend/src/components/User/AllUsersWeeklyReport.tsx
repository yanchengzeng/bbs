import { useState } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useWeeklyReports } from '../../hooks/usePosts';
import { PostCard } from '../Post/PostCard';
import { format, parseISO } from 'date-fns';
import { UserAvatar } from './UserAvatar';

interface AllUsersWeeklyReportProps {
  selectedUserId?: string | null;
}

export function AllUsersWeeklyReport({ selectedUserId }: AllUsersWeeklyReportProps) {
  const { data: users, isLoading: usersLoading } = useUsers();
  const [expandedCategories, setExpandedCategories] = useState<Map<string, Set<string>>>(new Map());
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

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

  const toggleUser = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <span className="ml-3 text-sm text-zinc-400">Loading reports...</span>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center text-sm text-zinc-400 py-12">
        No users found
      </div>
    );
  }

  // Filter users if selectedUserId is provided
  const displayUsers = selectedUserId 
    ? users.filter(u => u.id === selectedUserId)
    : users;

  return (
    <div className="space-y-6">
      {displayUsers.map((user) => (
        <UserWeeklyReportSection
          key={user.id}
          user={user}
          expandedUsers={expandedUsers}
          onToggleUser={toggleUser}
          expandedCategories={expandedCategories}
          onToggleCategory={toggleCategory}
        />
      ))}
    </div>
  );
}

interface UserWeeklyReportSectionProps {
  user: { id: string; name: string; avatar_url: string | null };
  expandedUsers: Set<string>;
  onToggleUser: (userId: string) => void;
  expandedCategories: Map<string, Set<string>>;
  onToggleCategory: (weekKey: string, tag: string) => void;
}

function UserWeeklyReportSection({ 
  user, 
  expandedUsers, 
  onToggleUser,
  expandedCategories,
  onToggleCategory
}: UserWeeklyReportSectionProps) {
  const { data: reports, isLoading } = useWeeklyReports(user.id);
  const isUserExpanded = expandedUsers.has(user.id);

  if (isLoading) {
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="md" />
          <span className="text-sm font-semibold text-white">{user.name}</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-2xl shadow-sm p-4">
        <button
          onClick={() => onToggleUser(user.id)}
          className="w-full flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity"
        >
          <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="md" />
          <span className="text-sm font-semibold text-white">{user.name}</span>
          <span className="ml-auto text-zinc-400 text-xs">
            {isUserExpanded ? '▼' : '▶'}
          </span>
        </button>
        {isUserExpanded && (
          <div className="text-center text-sm text-zinc-400 py-8">
            No weekly reports available
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-2xl shadow-sm p-4">
      <button
        onClick={() => onToggleUser(user.id)}
        className="w-full flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity"
      >
        <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="md" />
        <span className="text-sm font-semibold text-white">{user.name}</span>
        <span className="ml-auto text-zinc-400 text-xs">
          {isUserExpanded ? '▼' : '▶'}
        </span>
      </button>
      
      {isUserExpanded && (
        <div className="space-y-4">
          {reports.map((report) => {
            const weekKey = `${user.id}_${report.week_start}_${report.week_end}`;
            const expandedSet = expandedCategories.get(weekKey) || new Set();
            
            return (
              <div key={weekKey} className="border border-zinc-700 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-white mb-3">
                  {format(parseISO(report.week_start), 'MMM dd')} - {format(parseISO(report.week_end), 'MMM dd, yyyy')}
                </h4>
                
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
                            onClick={() => onToggleCategory(weekKey, category.tag)}
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
      )}
    </div>
  );
}
