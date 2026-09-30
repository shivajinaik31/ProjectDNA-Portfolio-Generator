import { Stack } from 'expo-router';
import { DN } from '@/constants/design-tokens';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DN.bg },
        animation: 'fade',
      }}
    />
  );
}
