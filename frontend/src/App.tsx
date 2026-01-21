import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/Layout/Header';
import { HomePage } from './pages/HomePage';
import { UserPage } from './pages/UserPage';
import { SearchPage } from './pages/SearchPage';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './hooks/useAuth';
import { useState, createContext, useContext } from 'react';

type HeaderTab = 'activity' | 'weekly';

interface HeaderContextType {
  activeTab: HeaderTab;
  setActiveTab: (tab: HeaderTab) => void;
}

const HeaderContext = createContext<HeaderContextType | null>(null);

export function useHeaderTabs() {
  const context = useContext(HeaderContext);
  if (!context) {
    // Return default values if context is not available (shouldn't happen on HomePage)
    return { activeTab: 'activity' as HeaderTab, setActiveTab: () => {} };
  }
  return context;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppRoutes() {
  useAuth(); // Initialize auth
  
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/users/:userId" element={<UserPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppWithHeader() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [activeTab, setActiveTab] = useState<HeaderTab>('activity');
  
  return (
    <>
      <Header activeTab={isHomePage ? activeTab : undefined} onTabChange={isHomePage ? setActiveTab : undefined} />
      <HeaderContext.Provider value={{ activeTab, setActiveTab }}>
        <AppRoutes />
      </HeaderContext.Provider>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-zinc-900 text-white">
          <AppWithHeader />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
