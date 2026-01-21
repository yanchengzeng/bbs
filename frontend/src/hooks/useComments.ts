import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import type { Comment } from './usePosts';

export interface CommentCreate {
  content: string;
  anonymous_name?: string;
}

export interface CommentUpdate {
  content: string;
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: CommentCreate }) =>
      apiRequest<Comment>(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: CommentUpdate }) =>
      apiRequest<Comment>(`/api/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (commentId: string) =>
      apiRequest(`/api/comments/${commentId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
