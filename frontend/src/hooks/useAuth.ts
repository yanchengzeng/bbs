import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getCurrentUser } from '../services/auth';

export function useAuth() {
  const { user, token, setUser, setToken, isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    // Check for token in URL (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Load user if token exists
    if (token || tokenFromUrl) {
      getCurrentUser()
        .then(setUser)
        .catch(() => {
          // Token invalid, clear it
          setToken(null);
          setUser(null);
        });
    }
  }, [token, setToken, setUser]);
  
  return {
    user,
    token,
    isAuthenticated: isAuthenticated(),
    setUser,
    setToken,
  };
}
