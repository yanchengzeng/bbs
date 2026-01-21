const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ApiError {
  detail: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  
  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }
  
  return response.json();
}
