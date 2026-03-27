import React, { createContext, useContext, useMemo, useState } from 'react';
import { AuthModal } from '../components/AuthModal';

type Resolver = (success: boolean) => void;
type AuthModalMode = 'login' | 'signup';

interface AuthModalContextValue {
  openAuthModal: (mode?: AuthModalMode) => Promise<boolean>;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [resolver, setResolver] = useState<Resolver | null>(null);
  const [initialMode, setInitialMode] = useState<AuthModalMode>('login');

  const openAuthModal = (mode: AuthModalMode = 'login') =>
    new Promise<boolean>((resolve) => {
      setInitialMode(mode);
      setResolver(() => resolve);
      setIsOpen(true);
    });

  const handleClose = (success: boolean) => {
    setIsOpen(false);
    resolver?.(success);
    setResolver(null);
  };

  const value = useMemo(() => ({ openAuthModal }), []);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal isOpen={isOpen} initialMode={initialMode} onClose={handleClose} />
    </AuthModalContext.Provider>
  );
};

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used inside AuthModalProvider');
  }
  return context;
}
