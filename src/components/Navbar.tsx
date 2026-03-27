import React from 'react';
import { Page, UserProfile } from '../types';
import { logout } from '../auth';
import { useAuthModal } from '../contexts/AuthModalContext';

interface NavbarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  user: UserProfile | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onPageChange, user }) => {
  const { openAuthModal } = useAuthModal();

  const handleLogin = async () => {
    try {
      await openAuthModal('login');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleSignUp = async () => {
    try {
      await openAuthModal('signup');
    } catch (error) {
      console.error('Signup failed:', error);
      alert('Signup failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#f7f5ff]/80 backdrop-blur-md shadow-[0_0_32px_0_rgba(35,44,81,0.06)]">
      <div className="max-w-7xl mx-auto px-8 flex justify-between items-center h-20">
        <div className="flex items-center gap-12">
          <button 
            onClick={() => onPageChange('landing')}
            className="text-2xl font-extrabold tracking-tighter text-primary font-headline cursor-pointer"
          >
            EduSwap
          </button>
          <div className="hidden md:flex gap-8 font-headline text-sm tracking-wide">
            <button 
              onClick={() => onPageChange('explore')}
              className={`${currentPage === 'explore' ? 'text-secondary font-bold border-b-2 border-secondary pb-1' : 'text-slate-600 hover:text-primary'} transition-all duration-300`}
            >
              Explore
            </button>
            <button 
              onClick={() => onPageChange('upload')}
              className={`${currentPage === 'upload' ? 'text-secondary font-bold border-b-2 border-secondary pb-1' : 'text-slate-600 hover:text-primary'} transition-all duration-300`}
            >
              Upload
            </button>
            <button 
              onClick={() => onPageChange('dashboard')}
              className={`${currentPage === 'dashboard' ? 'text-secondary font-bold border-b-2 border-secondary pb-1' : 'text-slate-600 hover:text-primary'} transition-all duration-300`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => onPageChange('community')}
              className={`${currentPage === 'community' ? 'text-secondary font-bold border-b-2 border-secondary pb-1' : 'text-slate-600 hover:text-primary'} transition-all duration-300`}
            >
              Community
            </button>
            <button 
              onClick={() => onPageChange('chat')}
              className={`${currentPage === 'chat' ? 'text-secondary font-bold border-b-2 border-secondary pb-1' : 'text-slate-600 hover:text-primary'} transition-all duration-300`}
            >
              Chat
            </button>
            <button 
              onClick={() => onPageChange('about')}
              className={`${currentPage === 'about' ? 'text-secondary font-bold border-b-2 border-secondary pb-1' : 'text-slate-600 hover:text-primary'} transition-all duration-300`}
            >
              About
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-bold text-on-surface leading-none">{user.displayName}</span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">{user.role}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border-2 border-primary/20">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt={user.displayName} className="w-full h-full object-cover" />
              </div>
              <button 
                onClick={handleLogout}
                className="text-slate-600 font-headline text-sm font-medium hover:text-primary transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={handleLogin}
                className="text-slate-600 font-headline text-sm font-medium hover:text-primary transition-all"
              >
                Login
              </button>
              <button 
                onClick={handleSignUp}
                className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-headline text-sm font-bold shadow-sm hover:opacity-80 active:scale-95 transition-all"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
