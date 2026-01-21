import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import type { Post } from '../hooks/usePosts';
import type { User } from '../services/auth';
import { PostCard } from '../components/Post/PostCard';
import { UserAvatar } from '../components/User/UserAvatar';
import { Link } from 'react-router-dom';

interface SearchResults {
  posts: Post[];
  users: User[];
}

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: results, isLoading } = useQuery<SearchResults>({
    queryKey: ['search', searchTerm],
    queryFn: () => apiRequest<SearchResults>(`/api/search?q=${encodeURIComponent(searchTerm)}`),
    enabled: searchTerm.length > 0,
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query);
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Search</h1>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts and users..."
            className="flex-1 px-4 py-2 border border-zinc-600 rounded-lg bg-zinc-900 text-white placeholder-zinc-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Search
          </button>
        </div>
      </form>
      
      {isLoading && searchTerm && (
        <div className="text-center text-zinc-400">Searching...</div>
      )}
      
      {results && searchTerm && (
        <div>
          {results.posts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                Posts ({results.posts.length})
              </h2>
              <div className="space-y-4">
                {results.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}
          
          {results.users.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Users ({results.users.length})
              </h2>
              <div className="space-y-3">
                {results.users.map((user) => (
                  <Link
                    key={user.id}
                    to={`/users/${user.id}`}
                    className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors"
                  >
                    <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="md" />
                    <div>
                      <div className="font-semibold text-white">{user.name}</div>
                      <div className="text-sm text-zinc-400">{user.email}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {results.posts.length === 0 && results.users.length === 0 && (
            <div className="text-center text-zinc-400 py-12">
              No results found for "{searchTerm}"
            </div>
          )}
        </div>
      )}
      
      {!searchTerm && (
        <div className="text-center text-zinc-400 py-12">
          Enter a search term to find posts and users
        </div>
      )}
    </div>
  );
}
