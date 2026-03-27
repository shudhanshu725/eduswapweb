import { createClient, type User, type Session, type AuthChangeEvent } from '@supabase/supabase-js';
import type { Database } from './supabase.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

async function upsertUserProfile(userId: string, displayName: string) {
  if (!userId || !displayName) return;
  try {
    await (
      supabase as unknown as {
        from: (table: string) => {
          upsert: (
            values: { user_id: string; display_name: string; updated_at: string },
            options?: { onConflict?: string }
          ) => Promise<unknown>;
        };
      }
    )
      .from('user_profiles')
      .upsert(
        { user_id: userId, display_name: displayName, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
  } catch {
    // Keep auth flow resilient even if profile table is not yet configured.
  }
}

// Email Signup
export async function signUpWithEmail(name: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        app_name: 'EduSwap',
      },
    },
  });

  if (error) throw error;
  if (data.user?.id) {
    await upsertUserProfile(data.user.id, name);
  }
  if (data.session) return data;

  // If email confirmation is enabled in Supabase, signUp won't return a session.
  // Try immediate login for "direct signup" UX.
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (loginError || !loginData.session) {
    throw new Error(
      'Direct signup blocked: turn OFF "Confirm email" in Supabase -> Authentication -> Providers -> Email.'
    );
  }
  if (loginData.user?.id) {
    await upsertUserProfile(loginData.user.id, name);
  }

  return loginData;
}

// Email Login
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (data.user?.id) {
    const displayName =
      String(data.user.user_metadata?.full_name || data.user.user_metadata?.name || '').trim() ||
      (data.user.email ? data.user.email.split('@')[0] : '');
    if (displayName) {
      await upsertUserProfile(data.user.id, displayName);
    }
  }
  return data;
}

// Logout
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Current User
export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

// Current Session
export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// Auth State Listener
export function onAuthStateChanged(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return () => subscription.unsubscribe();
}
