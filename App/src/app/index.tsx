import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuthScreen } from '@/components/AuthScreen';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check active session on app startup (Auto-Login persistence)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user);
      }
      setLoading(false);
    });

    // 2. Listen to realtime Auth changes (Sign In / Sign Out / OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch full user details from public.users table created by our database trigger
  const fetchUserProfile = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setUserProfile(data);
      }
    } catch (err) {
      console.log('Error fetching user profile:', err);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#070c18" />
        <ActivityIndicator size="large" color="#00c3e4" />
      </View>
    );
  }

  // If user is NOT logged in, show AuthScreen
  if (!session) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#070c18" />
        <AuthScreen />
      </View>
    );
  }

  // If user IS logged in (via Google, GitHub, or Email), show Authenticated Dashboard!
  const displayName = userProfile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
  const avatarUrl = userProfile?.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.dashboardContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#070c18" />
      
      {/* User Card */}
      <View style={styles.card}>
        <View style={styles.avatarWrapper}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.userEmail}>{session.user.email}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.providerBadge}>
            <Feather name="shield" size={12} color="#00c3e4" style={{ marginRight: 4 }} />
            <Text style={styles.providerBadgeText}>
              {session.user.app_metadata?.provider === 'google'
                ? 'Google Authenticated'
                : session.user.app_metadata?.provider === 'github'
                ? 'GitHub Authenticated'
                : 'Email Verified'}
            </Text>
          </View>
        </View>

        {/* Action Button: Sign Out */}
        <TouchableOpacity activeOpacity={0.85} style={styles.signOutBtn} onPress={handleSignOut}>
          <Feather name="log-out" size={16} color="#ff4d4f" style={{ marginRight: 8 }} />
          <Text style={styles.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerNote}>
        Session is persisted automatically. Re-opening the app will keep you signed in!
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070c18',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#070c18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
    minHeight: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0b1426',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#172640',
    alignItems: 'center',
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#00c3e4',
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0f2742',
    borderWidth: 2,
    borderColor: '#00c3e4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00c3e4',
  },
  welcomeText: {
    color: '#8ba1be',
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    color: '#00c3e4',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  badgeRow: {
    marginBottom: 24,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f2742',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#19395e',
  },
  providerBadgeText: {
    color: '#8ba1be',
    fontSize: 12,
    fontWeight: '600',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a1215',
    borderWidth: 1,
    borderColor: '#5c1d24',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
  },
  signOutBtnText: {
    color: '#ff4d4f',
    fontSize: 15,
    fontWeight: '700',
  },
  footerNote: {
    color: '#657b9c',
    fontSize: 12,
    marginTop: 20,
    textAlign: 'center',
  },
});
