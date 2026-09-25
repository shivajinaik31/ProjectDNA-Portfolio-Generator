import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DN, FontFamily, FontSize, Space, Radius } from '@/constants/design-tokens';

type StatWidgetProps = {
  label: string;
  value: string | number;
  icon: keyof typeof Feather.glyphMap;
  iconColor?: string;
  style?: ViewStyle;
};

/**
 * Compact stat tile: icon + numeric value + label.
 * Used in Dashboard stats row and Profile summary.
 */
export function StatWidget({
  label,
  value,
  icon,
  iconColor = DN.cyan,
  style,
}: StatWidgetProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconBox, { borderColor: iconColor + '33' }]}>
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DN.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: DN.border,
    padding: Space.md,
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: DN.bgElevated,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.sm,
  },
  value: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.monoBold,
    color: DN.textPrimary,
    marginBottom: 2,
  },
  label: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.mono,
    color: DN.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
