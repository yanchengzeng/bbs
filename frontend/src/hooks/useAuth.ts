import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getCurrentUser } from '../services/auth';

export function useAuth() {
  const { user, token, setUser, setToken, setRefreshToken, isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    // Check for token in URL (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    const refreshTokenFromUrl = urlParams.get('refresh_token');
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      if (refreshTokenFromUrl) {
        setRefreshToken(refreshTokenFromUrl);
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Load user if token exists
    if (token || tokenFromUrl) {
      getCurrentUser()
        .then(setUser)
        .catch(() => {
          // Token invalid - apiRequest will try to refresh automatically
          // If refresh fails, it will clear tokens, so we just clear user here
          setUser(null);
        });
    }
  }, [token, setToken, setRefreshToken, setUser]);
  
  return {
    user,
    token,
    isAuthenticated: isAuthenticated(),
    setUser,
    setToken,
  };
}
