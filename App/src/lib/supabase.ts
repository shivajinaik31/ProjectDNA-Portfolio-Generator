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
      detectSessionInUrl: Platform.OS === 'web', // Required for Web OAuth callback detection
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

    // On web, Linking.createURL() might return projectdna:// which fails in browsers.
    // We explicitly use the browser's current origin (e.g., http://localhost:8081) on the web.
    const redirectUrl = Platform.OS === 'web'
      ? typeof window !== 'undefined' ? window.location.origin : ''
      : Linking.createURL('/auth/callback');

    if (Platform.OS === 'web') {
      // On web, we let Supabase handle the browser redirect in the current tab natively
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) throw error;
      return { user: null, session: null, error: null };
    }

    // Native Mobile Flow (iOS / Android)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('No auth URL returned by Supabase');
    
    console.log('Starting OAuth with Redirect URL:', redirectUrl);

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    
    console.log('WebBrowser Result:', res.type);

    if (res.type === 'success' && res.url) {
      console.log('Full Callback URL:', res.url);
      
      let access_token = null;
      let refresh_token = null;

      // Extract from hash fragment (Supabase OAuth default)
      const fragment = res.url.split('#')[1];
      if (fragment) {
        const extractParams = (str: string) => {
          const params: Record<string, string> = {};
          str.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key && value) {
              params[key] = decodeURIComponent(value);
            }
          });
          return params;
        };
        const parsed = extractParams(fragment);
        access_token = parsed['access_token'];
        refresh_token = parsed['refresh_token'];
      }

      // Fallback to query parameters
      if (!access_token || !refresh_token) {
        const { queryParams } = Linking.parse(res.url);
        access_token = queryParams?.access_token as string;
        refresh_token = queryParams?.refresh_token as string;
      }
      
      if (access_token && refresh_token) {
        console.log('Successfully extracted tokens. Setting session...');
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) throw sessionError;
        return { user: sessionData.user, session: sessionData.session, error: null };
      } else {
        console.warn('Tokens not found in URL.');
      }
    } else {
      console.warn('WebBrowser did not return success or URL is missing.');
    }

    return { user: null, session: null, error: null };
  } catch (err: any) {
    console.error(`OAuth error for ${provider}:`, err);
    return { user: null, session: null, error: err };
  }
}
