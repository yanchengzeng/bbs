import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';

interface LikeResponse {
  liked: boolean;
  like_count: number;
}

interface PostLikesResponse {
  like_count: number;
  users: Array<{
    id: string;
    name: string;
    avatar_url: string | null;
  }>;
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (postId: string) =>
      apiRequest<LikeResponse>(`/api/posts/${postId}/like`, {
        method: 'POST',
      }),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['post-likes', postId] });
    },
  });
}

export function usePostLikes(postId: string, enabled: boolean = false) {
  return useQuery({
    queryKey: ['post-likes', postId],
    queryFn: () => apiRequest<PostLikesResponse>(`/api/posts/${postId}/likes`),
    enabled: enabled,
  });
}
