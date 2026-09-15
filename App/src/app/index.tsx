import { Redirect } from 'expo-router';

/**
 * Root index — redirects to the appropriate route group.
 * Auth gating is handled in _layout.tsx.
 */
export default function RootIndex() {
  return <Redirect href="/(tabs)" />;
}
