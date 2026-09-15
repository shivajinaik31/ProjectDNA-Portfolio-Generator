import { Redirect } from 'expo-router';

/**
 * Explore was part of the Expo starter template.
 * Redirect to tabs as this route is no longer used.
 */
export default function ExploreFallback() {
  return <Redirect href="/(tabs)" />;
}
