import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';

export interface Post {
  id: string;
  user_id: string | null;
  anonymous_name: string | null;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string | null;
  is_edited: boolean;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
  comments: Comment[];
  like_count: number;
  is_liked: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string | null;
  anonymous_name: string | null;
  content: string;
  created_at: string;
  updated_at: string | null;
  is_edited: boolean;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

export interface PostCreate {
  content: string;
  tags?: string[];
}

export function usePosts(userId?: string, date?: string) {
  return useQuery({
    queryKey: ['posts', userId, date],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (date) params.append('date', date);
      const url = params.toString() ? `/api/posts?${params.toString()}` : '/api/posts';
      return apiRequest<Post[]>(url);
    },
  });
}

export function usePost(postId: string) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => apiRequest<Post>(`/api/posts/${postId}`),
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: PostCreate) =>
      apiRequest<Post>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-summary'] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: { content?: string; tags?: string[] } }) =>
      apiRequest<Post>(`/api/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['weekly-summary'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (postId: string) =>
      apiRequest(`/api/posts/${postId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export interface WeeklySummaryItem {
  tag: string;
  count: number;
  posts: Post[];
}

export function useWeeklySummary(userId: string) {
  return useQuery({
    queryKey: ['weekly-summary', userId],
    queryFn: () => apiRequest<WeeklySummaryItem[]>(`/api/users/${userId}/weekly-summary`),
    enabled: !!userId,
  });
}

export interface WeeklyReport {
  week_start: string;
  week_end: string;
  categories: WeeklySummaryItem[];
}

export function useWeeklyReports(userId: string) {
  return useQuery({
    queryKey: ['weekly-reports', userId],
    queryFn: () => apiRequest<WeeklyReport[]>(`/api/users/${userId}/weekly-reports`),
    enabled: !!userId,
  });
}
