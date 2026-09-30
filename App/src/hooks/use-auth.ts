import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_slug?: string | null;
  portfolio_is_public?: boolean;
  portfolio_updated_at?: string | null;
  created_at: string;
  updated_at: string;
};

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

/**
 * Central auth state hook.
 * Manages Supabase session, auth user, and public.users profile in one place.
 * This replaces the inline session logic that was scattered in index.tsx.
 */
export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.log('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    // 1. Check active session on app startup (auto-login persistence)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user);
      }
      setLoading(false);
    });

    // 2. Listen to realtime auth changes (sign in / sign out / OAuth redirect)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user);
    }
  };

  return {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signOut,
    refreshProfile,
  };
}
