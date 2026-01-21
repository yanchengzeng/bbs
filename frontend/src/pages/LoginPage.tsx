import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoginButton } from '../components/Auth/LoginButton';

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center px-4 py-16">
      <div className="bg-zinc-800 rounded-2xl shadow-sm border border-zinc-700 p-8 text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-8">Log in with the following options</h1>
        <LoginButton />
      </div>
    </div>
  );
}
