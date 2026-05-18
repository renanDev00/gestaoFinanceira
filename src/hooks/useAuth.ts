import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, DbProfile } from '../lib/supabase';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Helper: fetch profile
  const fetchProfile = async (user: User): Promise<AuthUser> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      return {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
        email: user.email || '',
      };
    }

    const profile = data as DbProfile;
    return {
      id: profile.id,
      name: profile.name || user.email?.split('@')[0] || 'Usuário',
      email: profile.email || user.email || '',
    };
  };

  // Bootstrap: restore session
  useEffect(() => {
    let cancelled = false;

    // Safety timeout — never stay stuck loading
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 5000);

    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Supabase getSession error:', error.message);
          setLoading(false);
          return;
        }
        setSession(session);
        if (session?.user) {
          const profile = await fetchProfile(session.user);
          if (!cancelled) setAuthUser(profile);
        }
        if (!cancelled) setLoading(false);
      })
      .catch((err) => {
        console.error('Supabase connection error:', err);
        if (!cancelled) setLoading(false);
      })
      .finally(() => clearTimeout(timeout));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          const profile = await fetchProfile(session.user);
          setAuthUser(profile);
        } else {
          setAuthUser(null);
        }
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // ---------- Actions ----------

  const signUp = async (name: string, email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setAuthError(translateError(error.message));
      return false;
    }
    return true;
  };

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthError(translateError(error.message));
      return false;
    }
    return true;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setSession(null);
  };

  const clearError = () => setAuthError(null);

  return {
    session,
    authUser,
    loading,
    authError,
    isLoggedIn: !!session,
    signUp,
    signIn,
    signOut,
    clearError,
  };
}

// Translate Supabase auth errors to Portuguese
function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials'))
    return 'Email ou senha incorretos.';
  if (msg.includes('Email not confirmed'))
    return 'Por favor, confirme seu email antes de entrar.';
  if (msg.includes('User already registered'))
    return 'Este email já está cadastrado.';
  if (msg.includes('Password should be at least'))
    return 'A senha deve ter pelo menos 6 caracteres.';
  if (msg.includes('Unable to validate email address'))
    return 'Email inválido.';
  return msg;
}
