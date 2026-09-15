import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { DN, FontFamily, FontSize, Space } from '@/constants/design-tokens';

type LoadingOverlayProps = {
  message?: string;
  fullScreen?: boolean;
};

/**
 * Full-screen or inline loading indicator with optional message.
 */
export function LoadingOverlay({
  message,
  fullScreen = true,
}: LoadingOverlayProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={DN.cyan} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Space['2xl'],
  },
  fullScreen: {
    flex: 1,
    backgroundColor: DN.bg,
  },
  message: {
    marginTop: Space.base,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textSecondary,
  },
});
