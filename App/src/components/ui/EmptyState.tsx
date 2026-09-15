import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DN, FontFamily, FontSize, Space } from '@/constants/design-tokens';

type EmptyStateProps = {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  message?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Empty state placeholder with icon, title, message, and optional action.
 * Used in Portfolio (no projects), Skill DNA (no skills), Activity Feed, etc.
 */
export function EmptyState({
  icon = 'inbox',
  title,
  message,
  action,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Feather name={icon} size={28} color={DN.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {action && <View style={styles.actionWrapper}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Space['3xl'],
    paddingHorizontal: Space.xl,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DN.bgElevated,
    borderWidth: 1,
    borderColor: DN.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.base,
  },
  title: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: DN.textSecondary,
    textAlign: 'center',
    marginBottom: Space.xs,
  },
  message: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionWrapper: {
    marginTop: Space.lg,
  },
});
