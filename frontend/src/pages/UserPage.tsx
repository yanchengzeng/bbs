import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePosts } from '../hooks/usePosts';
import { PostList } from '../components/Post/PostList';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import type { User } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import { UserPageSidebar } from '../components/User/UserPageSidebar';
import { WeeklyReport } from '../components/User/WeeklyReport';

type ActivityTab = 'feed' | 'report';

export function UserPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { data: posts, isLoading: postsLoading, error: postsError } = usePosts(userId);
  const [userName, setUserName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ActivityTab>('feed');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { data: user, isLoading: userLoading, error: userError } = useQuery<User>({
    queryKey: ['user', userId],
    queryFn: () => apiRequest<User>(`/api/users/${userId}`),
    enabled: !!userId,
  });
  
  useEffect(() => {
    if (user) {
      setUserName(user.name);
    }
  }, [user]);
  
  const isLoading = postsLoading || userLoading;
  const error = postsError || userError;
  const isOwnProfile = currentUser?.id === userId;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-3 text-sm text-zinc-400">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (error || !user) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-900 border border-red-700 rounded-lg p-4">
            <div className="text-sm text-red-200">
              <strong>Error loading user:</strong> {error instanceof Error ? error.message : 'User not found'}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const displayName = userName || user.name;
  
  const handleTabChange = (tab: ActivityTab) => {
    setActiveTab(tab);
    // Close sidebar on mobile when tab is changed
    setIsSidebarOpen(false);
  };
  
  return (
    <div className="min-h-screen bg-zinc-900 text-white flex relative">
      {/* Mobile backdrop overlay */}
      {isOwnProfile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Mobile menu button */}
      {isOwnProfile && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-20 left-4 z-40 md:hidden p-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg 
            className="w-6 h-6 text-zinc-300" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            {isSidebarOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      )}
      
      {/* Sidebar */}
      {isOwnProfile && (
        <UserPageSidebar 
          userId={userId!}
          currentName={displayName}
          onNameUpdate={setUserName}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Main Content */}
      <div className="flex-1 min-w-0 w-full">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6">
          {activeTab === 'feed' ? (
            <>
              {posts && posts.length > 0 ? (
                <PostList posts={posts} />
              ) : (
                <div className="text-center text-sm text-zinc-400 py-12">
                  {isOwnProfile ? "You haven't posted anything yet." : `${displayName} hasn't posted anything yet.`}
                </div>
              )}
            </>
          ) : (
            <WeeklyReport userId={userId!} />
          )}
        </div>
      </div>
    </div>
  );
}
