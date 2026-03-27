import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { Page, UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { ExplorePage } from './pages/ExplorePage';
import { UploadPage } from './pages/UploadPage';
import { DashboardPage } from './pages/DashboardPage';
import { CommunityPage } from './pages/CommunityPage';
import { ChatPage } from './pages/ChatPage';
import { InfoPage } from './pages/InfoPage';
import { getSession, onAuthStateChanged } from './auth';

const routeToPage: Record<string, Page> = {
  '/': 'landing',
  '/explore': 'explore',
  '/upload': 'upload',
  '/dashboard': 'dashboard',
  '/community': 'community',
  '/chat': 'chat',
  '/about': 'about',
  '/terms': 'terms',
  '/privacy': 'privacy',
  '/help': 'help',
  '/contact': 'contact',
};

const pageToRoute: Record<Page, string> = {
  landing: '/',
  explore: '/explore',
  upload: '/upload',
  dashboard: '/dashboard',
  community: '/community',
  chat: '/chat',
  about: '/about',
  terms: '/terms',
  privacy: '/privacy',
  help: '/help',
  contact: '/contact',
};

function mapAuthUserToProfile(authUser: User): UserProfile {
  const email = authUser.email ?? '';
  const fallbackName = email ? email.split('@')[0] : 'Anonymous';
  return {
    uid: authUser.id,
    displayName: authUser.user_metadata?.full_name || authUser.user_metadata?.name || fallbackName,
    email,
    photoURL: authUser.user_metadata?.avatar_url || '',
    role: 'user',
    createdAt: new Date().toISOString(),
  };
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const currentPage = useMemo<Page>(() => routeToPage[location.pathname] ?? 'landing', [location.pathname]);

  // Handle Auth State
  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await getSession();
        setUser(session?.user ? mapAuthUserToProfile(session.user) : null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged((_event, session) => {
      setUser(session?.user ? mapAuthUserToProfile(session.user) : null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Add Material Symbols link to head
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(fontLink);
    };
  }, []);
  const onPageChange = (page: Page) => navigate(pageToRoute[page]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar currentPage={currentPage} onPageChange={onPageChange} user={user} />
      <div className="flex-grow">
        {loading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<LandingPage onPageChange={onPageChange} />} />
            <Route path="/explore" element={<ExplorePage user={user} />} />
            <Route path="/upload" element={<UploadPage user={user} onPageChange={onPageChange} />} />
            <Route path="/dashboard" element={<DashboardPage user={user} onPageChange={onPageChange} />} />
            <Route path="/community" element={<CommunityPage user={user} />} />
            <Route path="/chat" element={<ChatPage user={user} />} />
            <Route path="/about" element={<InfoPage type="about" />} />
            <Route path="/terms" element={<InfoPage type="terms" />} />
            <Route path="/privacy" element={<InfoPage type="privacy" />} />
            <Route path="/help" element={<InfoPage type="help" />} />
            <Route path="/contact" element={<InfoPage type="contact" />} />
            <Route path="*" element={<LandingPage onPageChange={onPageChange} />} />
          </Routes>
        )}
      </div>
      <Footer onPageChange={onPageChange} />
    </div>
  );
}
