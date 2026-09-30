import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { AuthScreen } from '@/components/AuthScreen';
import { DN } from '@/constants/design-tokens';

/**
 * Login screen — renders the existing AuthScreen component.
 * This is the only screen in the (auth) group.
 */
export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DN.bg} />
      <AuthScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DN.bg,
  },
});
