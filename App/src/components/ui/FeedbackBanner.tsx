import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DN, FontFamily, FontSize, Space, Radius } from '@/constants/design-tokens';

type FeedbackBannerProps = {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  style?: ViewStyle;
};

const config = {
  error: {
    icon: 'alert-circle' as const,
    iconColor: DN.error,
    bg: DN.errorBg,
    border: DN.errorBorder,
    text: DN.errorText,
  },
  success: {
    icon: 'check-circle' as const,
    iconColor: DN.cyan,
    bg: DN.cyanDark,
    border: DN.borderFocus,
    text: DN.cyan,
  },
  warning: {
    icon: 'alert-triangle' as const,
    iconColor: DN.warning,
    bg: DN.warningBg,
    border: DN.warningBorder,
    text: DN.warning,
  },
  info: {
    icon: 'info' as const,
    iconColor: DN.cyan,
    bg: DN.cyanDark,
    border: DN.borderFocus,
    text: DN.cyan,
  },
};

/**
 * Inline feedback banner for form validation, success, or warning messages.
 * Replaces Alert.alert() for better inline UX.
 */
export function FeedbackBanner({ type, message, style }: FeedbackBannerProps) {
  const c = config[type];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: c.bg, borderColor: c.border },
        style,
      ]}
    >
      <Feather name={c.icon} size={16} color={c.iconColor} style={styles.icon} />
      <Text style={[styles.text, { color: c.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Space.md,
    width: '100%',
    marginBottom: Space.base,
  },
  icon: {
    marginRight: Space.sm,
  },
  text: {
    flex: 1,
    fontSize: FontSize.sm + 1,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
});
