import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserAvatar } from '../User/UserAvatar';

type HeaderTab = 'activity' | 'weekly';

interface HeaderProps {
  activeTab?: HeaderTab;
  onTabChange?: (tab: HeaderTab) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { user, isAuthenticated } = useAuth();
  const isHomePage = activeTab !== undefined && onTabChange !== undefined;
  
  return (
    <header className="sticky top-0 z-20 bg-zinc-800 shadow-sm border-b border-zinc-700">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3">
        <div className="flex items-center justify-between relative">
          <Link to="/" className="text-xl font-bold text-zinc-300 hover:text-zinc-200">
            BBS
          </Link>
          
          {isHomePage && (
            <div className="absolute left-1/2 transform -translate-x-1/2 flex gap-2">
              <button
                onClick={() => onTabChange('activity')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'activity'
                    ? 'border-zinc-300 text-zinc-300'
                    : 'border-transparent text-zinc-400 hover:text-zinc-300'
                }`}
              >
                Activity Board
              </button>
              <button
                onClick={() => onTabChange('weekly')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'weekly'
                    ? 'border-zinc-300 text-zinc-300'
                    : 'border-transparent text-zinc-400 hover:text-zinc-300'
                }`}
              >
                Weekly Report
              </button>
            </div>
          )}
          
          <nav className="flex items-center gap-3 sm:gap-4">
            {isAuthenticated && user ? (
              <Link
                to={`/users/${user.id}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                title="Go to your profile"
              >
                <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="md" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-zinc-700 text-zinc-100 rounded-lg hover:bg-zinc-600 transition-colors text-sm border border-zinc-600"
              >
                Sign Up / Log In
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
