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

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  return data.access_token;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/';
}
