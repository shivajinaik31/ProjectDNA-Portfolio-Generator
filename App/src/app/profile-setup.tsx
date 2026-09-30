import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '@/hooks/use-auth';
import ProfileSetup from '@/components/ProfileSetup';

export default function ProfileSetupScreen() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ProfileSetup
      userId={user.id}
      initialName={profile?.full_name || user.user_metadata?.full_name || ''}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});