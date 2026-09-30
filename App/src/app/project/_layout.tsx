import { Stack } from 'expo-router';
import { DN } from '@/constants/design-tokens';

/**
 * Stack layout for project-related screens.
 * These are pushed on top of the tab navigator.
 */
export default function ProjectLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DN.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
