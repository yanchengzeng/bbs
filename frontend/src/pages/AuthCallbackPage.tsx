import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getCurrentUser } from '../services/auth';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken, setUser } = useAuthStore();
  
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Save token
      setToken(token);
      
      // Fetch user info
      getCurrentUser()
        .then((user) => {
          setUser(user);
          // Redirect to home after successful auth
          navigate('/', { replace: true });
        })
        .catch((error) => {
          console.error('Failed to get user:', error);
          // Token invalid, clear it and redirect to login
          setToken(null);
          setUser(null);
          navigate('/login', { replace: true });
        });
    } else {
      // No token in URL, redirect to home
      navigate('/', { replace: true });
    }
  }, [searchParams, setToken, setUser, navigate]);
  
  // Show loading state while processing
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="text-white text-center">
        <p>Completing login...</p>
      </div>
    </div>
  );
}
