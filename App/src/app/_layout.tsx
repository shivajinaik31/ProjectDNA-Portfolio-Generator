import { useEffect, useCallback, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { StatusBar } from 'react-native';
import { useAuth } from '@/hooks/use-auth';
import { DN } from '@/constants/design-tokens';
import { ProjectSplash } from '@/components/ui/ProjectSplash';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [splashAnimationDone, setSplashAnimationDone] = useState(false);

  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('@/assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('@/assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('@/assets/fonts/Inter-Bold.ttf'),
    'Inter-ExtraBold': require('@/assets/fonts/Inter-ExtraBold.ttf'),
    'JetBrainsMono-Regular': require('@/assets/fonts/JetBrainsMono-Regular.ttf'),
    'JetBrainsMono-Medium': require('@/assets/fonts/JetBrainsMono-Medium.ttf'),
    'JetBrainsMono-Bold': require('@/assets/fonts/JetBrainsMono-Bold.ttf'),
  });

  
  // Hide native splash once fonts are ready
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Hide custom splash only when app loading + animation are done
  useEffect(() => {
    if (fontsLoaded && !loading && splashAnimationDone) {
      setShowSplash(false);
    }
  }, [fontsLoaded, loading, splashAnimationDone]);

  // Auth-gated navigation
  useEffect(() => {
    if (loading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isPublicPortfolio = segments[0] === 'portfolio';

    if (!session && !inAuthGroup && !isPublicPortfolio) {
      // Not signed in → redirect to auth
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Signed in → redirect to main tabs
      router.replace('/(tabs)');
    }
  }, [session, loading, fontsLoaded, segments]);


  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={DN.bg} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: DN.bg },
          animation: 'none',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="portfolio" />
        <Stack.Screen
          name="project"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>
      {showSplash && (
 <ProjectSplash
  onFinish={() => setSplashAnimationDone(true)}
/>
)}
    </>
  );
}
