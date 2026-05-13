import React, { useEffect, useState } from 'react';
import { signInWithEmail, signUpWithEmail, verifySignupOtp } from '../auth';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: AuthMode;
  onClose: (success: boolean) => void;
}

type AuthMode = 'login' | 'signup' | 'verify-otp';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode = 'login', onClose }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setError('');
    setNotice('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const resetAndClose = (success: boolean) => {
    setError('');
    setNotice('');
    setName('');
    setEmail('');
    setPassword('');
    setOtp('');
    onClose(success);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');

    try {
      if (mode === 'login') {
        await signInWithEmail(email.trim(), password.trim());
        resetAndClose(true);
      } else if (mode === 'verify-otp') {
        await verifySignupOtp(email.trim(), otp.trim(), name.trim());
        resetAndClose(true);
      } else {
        if (!name.trim()) {
          setError('Name is required');
          return;
        }
        const result = await signUpWithEmail(name.trim(), email.trim(), password.trim());
        if (result.requiresEmailConfirmation) {
          setNotice('OTP sent to your Gmail. Enter the 6 digit code to verify your account.');
          setMode('verify-otp');
          setPassword('');
          return;
        }
        resetAndClose(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
      <button
        className="absolute inset-0 bg-black/50"
        aria-label="Close auth modal"
        onClick={() => resetAndClose(false)}
      />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <h2 className="font-headline text-2xl font-extrabold text-on-surface">
          {mode === 'login' ? 'Login' : mode === 'verify-otp' ? 'Verify OTP' : 'Create Account'}
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          {mode === 'verify-otp'
            ? `Enter the OTP sent to ${email}.`
            : 'Use your Gmail account to continue to EduSwap.'}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="h-12 w-full rounded-xl border border-outline-variant/30 px-4 outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          )}
          {mode === 'verify-otp' ? (
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6 digit OTP"
              className="h-12 w-full rounded-xl border border-outline-variant/30 px-4 text-center text-lg font-bold tracking-[0.35em] outline-none focus:ring-2 focus:ring-primary/30"
              minLength={6}
              maxLength={6}
              required
            />
          ) : (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Gmail address"
                className="h-12 w-full rounded-xl border border-outline-variant/30 px-4 outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 chars)"
                className="h-12 w-full rounded-xl border border-outline-variant/30 px-4 outline-none focus:ring-2 focus:ring-primary/30"
                minLength={6}
                required
              />
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-emerald-700">{notice}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="h-12 w-full rounded-xl bg-primary font-headline font-bold text-on-primary disabled:opacity-60"
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Login' : mode === 'verify-otp' ? 'Verify OTP' : 'Sign Up'}
          </button>
        </form>

        <button
          className="mt-4 text-sm font-semibold text-primary"
          onClick={() => {
            setError('');
            setNotice('');
            setOtp('');
            setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
          }}
        >
          {mode === 'login' ? 'New user? Create account' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
};
