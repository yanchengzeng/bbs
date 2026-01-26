import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      return apiRequest<string[]>('/api/posts/tags/all');
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}

export function useInvalidateTags() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['tags'] });
  };
}
