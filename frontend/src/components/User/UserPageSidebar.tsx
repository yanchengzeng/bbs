import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/auth';
import { useUpdateUser } from '../../hooks/useUsers';

type ActivityTab = 'feed' | 'report';

interface UserPageSidebarProps {
  userId: string;
  currentName: string;
  onNameUpdate: (newName: string) => void;
  activeTab: ActivityTab;
  onTabChange: (tab: ActivityTab) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function UserPageSidebar({ userId, currentName, onNameUpdate, activeTab, onTabChange, isOpen = true, onClose }: UserPageSidebarProps) {
  const { user: currentUser } = useAuth();
  const updateUser = useUpdateUser();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(currentName);
  const isOwnProfile = currentUser?.id === userId;

  const handleNameSave = () => {
    if (editName.trim() && editName !== currentName) {
      updateUser.mutate(
        { userId, data: { name: editName.trim() } },
        {
          onSuccess: () => {
            setIsEditingName(false);
            onNameUpdate(editName.trim());
          }
        }
      );
    } else {
      setIsEditingName(false);
      setEditName(currentName);
    }
  };

  if (!isOwnProfile) {
    return null;
  }

  return (
    <div className={`
      w-64 bg-zinc-800 border-r border-zinc-700 p-4 space-y-6
      fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] overflow-y-auto
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0
    `}>
      {/* Edit Username Section */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Settings</h3>
        {isEditingName ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full p-2 border border-zinc-600 rounded-lg bg-zinc-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              placeholder="Enter your name"
            />
            <div className="flex gap-2">
              <button
                onClick={handleNameSave}
                className="px-3 py-1 bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 text-xs transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditingName(false);
                  setEditName(currentName);
                }}
                className="px-3 py-1 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-xs text-zinc-400 mb-1">Display Name</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">{currentName}</span>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-xs text-zinc-400 hover:text-zinc-300"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activities Section */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Activities</h3>
        <div className="space-y-1">
          <button
            onClick={() => onTabChange('feed')}
            className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
              activeTab === 'feed'
                ? 'bg-white text-zinc-900'
                : 'text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Activity Feed
          </button>
          <button
            onClick={() => onTabChange('report')}
            className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
              activeTab === 'report'
                ? 'bg-white text-zinc-900'
                : 'text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Weekly Report
          </button>
        </div>
      </div>

      {/* Sign Out Section */}
      <div>
        <button
          onClick={logout}
          className="w-full px-4 py-2 bg-red-900 text-red-200 rounded-lg hover:bg-red-800 transition-colors text-sm font-medium"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
