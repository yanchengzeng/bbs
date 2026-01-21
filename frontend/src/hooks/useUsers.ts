import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  last_login: string;
}

export interface UserUpdate {
  name?: string;
  bio?: string;
  avatar_url?: string | null;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiRequest<User[]>('/api/users'),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UserUpdate }) =>
      apiRequest<User>(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
    },
  });
}
