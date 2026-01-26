const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ApiError {
  detail: string;
}

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshTokenIfNeeded(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    return null;
  }

  // If already refreshing, wait for that promise
  if (isRefreshing && refreshPromise) {
    try {
      return await refreshPromise;
    } catch {
      return null;
    }
  }

  // Start refresh
  isRefreshing = true;
  refreshPromise = fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      const data = await response.json();
      const newAccessToken = data.access_token;
      localStorage.setItem('token', newAccessToken);
      // Update token in store
      const { useAuthStore } = await import('../store/authStore');
      useAuthStore.getState().setToken(newAccessToken);
      return newAccessToken;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  try {
    return await refreshPromise;
  } catch {
    // Refresh failed, clear tokens
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    // Update store
    const { useAuthStore } = await import('../store/authStore');
    useAuthStore.getState().setToken(null);
    useAuthStore.getState().setRefreshToken(null);
    return null;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  // If 401 and we have a refresh token, try to refresh
  if (response.status === 401 && localStorage.getItem('refresh_token')) {
    const newToken = await refreshTokenIfNeeded();
    if (newToken) {
      // Retry request with new token
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
    }
  }
  
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
