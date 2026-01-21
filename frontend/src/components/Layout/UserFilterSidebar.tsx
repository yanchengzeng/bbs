import { useState } from 'react';
import { UserAvatar } from '../User/UserAvatar';
import { useUsers } from '../../hooks/useUsers';

type SidebarTab = 'user-filter' | 'time-filter';

interface UserFilterSidebarProps {
  selectedUserId: string | null;
  onUserSelect: (userId: string | null) => void;
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
  showTimeFilter?: boolean;
}

export function UserFilterSidebar({ selectedUserId, onUserSelect, selectedDate, onDateSelect, showTimeFilter = true }: UserFilterSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>('user-filter');
  const { data: users, isLoading } = useUsers();

  const handleUserClick = (userId: string) => {
    if (selectedUserId === userId) {
      onUserSelect(null); // Deselect if clicking the same user
    } else {
      onUserSelect(userId); // Select new user
    }
  };


  return (
    <div className={`fixed left-0 top-[64px] bottom-0 bg-white border-r border-zinc-200/70 shadow-sm z-10 transition-all duration-300 ${
      isExpanded ? 'w-64' : 'w-16'
    }`}>
      {/* Toggle Button with Menu Icon */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 sm:p-4 border-b border-zinc-200/70 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
        title={isExpanded ? "Collapse menu" : "Expand menu"}
      >
        <svg className="w-5 h-5 text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        {isExpanded && (
          <span className="text-sm font-semibold text-zinc-900">
            Menu
          </span>
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
          {/* Tab Navigation */}
          <div className="flex border-b border-zinc-200/70">
            <button
              onClick={() => setActiveTab('user-filter')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'user-filter'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              User Filter
            </button>
            {showTimeFilter && (
              <button
                onClick={() => setActiveTab('time-filter')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'time-filter'
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                Time Filter
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {activeTab === 'user-filter' && (
              <div>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-600"></div>
                  </div>
                ) : users && users.length > 0 ? (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserClick(user.id)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                          selectedUserId === user.id
                            ? 'bg-green-50 border-2 border-green-500'
                            : 'hover:bg-zinc-50 border-2 border-transparent'
                        }`}
                      >
                        <div className="relative">
                          <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="md" />
                          {selectedUserId === user.id && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-zinc-900 truncate flex-1 text-left">
                          {user.name}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-sm text-zinc-500 py-8">
                    No users found
                  </div>
                )}
              </div>
            )}

            {activeTab === 'time-filter' && showTimeFilter && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">
                    Filter by Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate || ''}
                    onChange={(e) => onDateSelect(e.target.value || null)}
                    className="w-full p-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  />
                  {selectedDate && (
                    <button
                      onClick={() => onDateSelect(null)}
                      className="mt-2 w-full px-3 py-1 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 text-xs transition-colors"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
