import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Complete WebBrowser auth session safely when in browser context
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  WebBrowser.maybeCompleteAuthSession();
}

/**
 * SSR-safe storage adapter for Supabase & React Native / Expo Web
 * Prevents "ReferenceError: window is not defined" during Expo Router server rendering
 */
const ExpoSSRSafeStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export function isSupabaseConfigured(): boolean {
  return (
    !!supabaseUrl &&
    !!supabaseAnonKey &&
    !supabaseUrl.includes('your-supabase-id') &&
    supabaseUrl.startsWith('https://')
  );
}

export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      storage: ExpoSSRSafeStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

/**
 * Perform OAuth Login (Google or GitHub) via Supabase Auth & Expo WebBrowser
 */
export async function performOAuthSignIn(provider: 'google' | 'github') {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase project URL is missing! Please update your .env file with your actual Supabase URL and Key.');
    }

    const redirectUrl = Linking.createURL('/auth/callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('No auth URL returned by Supabase');

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (res.type === 'success' && res.url) {
      const { queryParams } = Linking.parse(res.url);
      
      if (queryParams?.access_token && queryParams?.refresh_token) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: queryParams.access_token as string,
          refresh_token: queryParams.refresh_token as string,
        });

        if (sessionError) throw sessionError;
        return { user: sessionData.user, session: sessionData.session, error: null };
      }
    }

    return { user: null, session: null, error: null };
  } catch (err: any) {
    console.error(`OAuth error for ${provider}:`, err);
    return { user: null, session: null, error: err };
  }
}
