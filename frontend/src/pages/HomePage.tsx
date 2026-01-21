import { usePosts } from '../hooks/usePosts';
import { PostList } from '../components/Post/PostList';
import { PostForm } from '../components/Post/PostForm';
import { AllUsersWeeklyReport } from '../components/User/AllUsersWeeklyReport';
import { useHeaderTabs } from '../App';

export function HomePage() {
  const { activeTab } = useHeaderTabs();
  const { data: posts, isLoading, error } = usePosts();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <div className="mx-auto max-w-2xl px-3 sm:px-4 pt-3">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-3 text-sm text-zinc-400">Loading posts...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <div className="mx-auto max-w-2xl px-3 sm:px-4 pt-3">
          <div className="bg-red-900 border border-red-700 rounded-2xl shadow-sm p-4">
            <div className="text-sm text-red-200">
              <strong>Error loading posts:</strong> {error.message}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Main Content */}
      <div className="pt-4">
        <div className="mx-auto max-w-2xl px-3 sm:px-4">
          {activeTab === 'activity' ? (
            <>
              {/* Post Form at top */}
              <div className="mb-4">
                <PostForm />
              </div>
              
              {/* Feed */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <span className="ml-3 text-sm text-zinc-400">Loading posts...</span>
                </div>
              ) : error ? (
                <div className="bg-red-900 border border-red-700 rounded-2xl shadow-sm p-4">
                  <div className="text-sm text-red-200">
                    <strong>Error loading posts:</strong> {error.message}
                  </div>
                </div>
              ) : posts && posts.length > 0 ? (
                <PostList posts={posts} />
              ) : (
                <div className="text-center text-sm text-zinc-400 py-12">
                  No posts yet. Be the first to post!
                </div>
              )}
            </>
          ) : (
            <AllUsersWeeklyReport selectedUserId={null} />
          )}
        </div>
      </div>
    </div>
  );
}
