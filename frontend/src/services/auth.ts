import { apiRequest } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  last_login: string;
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/auth/me');
}

export function loginWithGoogle() {
  window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/google`;
}

export function logout() {
  localStorage.removeItem('token');
  window.location.href = '/';
}
