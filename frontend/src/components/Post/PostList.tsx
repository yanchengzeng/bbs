import type { Post } from '../../hooks/usePosts';
import { PostCard } from './PostCard';
import { DateSeparator } from '../Layout/DateSeparator';
import { groupPostsByDate } from '../../utils/dateUtils';

interface PostListProps {
  posts: Post[];
}

export function PostList({ posts }: PostListProps) {
  const groupedPosts = groupPostsByDate(posts);
  
  return (
    <div className="space-y-3">
      {Array.from(groupedPosts.entries()).map(([date, datePosts]) => (
        <div key={date}>
          <DateSeparator date={date} />
          <div className="space-y-3">
            {datePosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
