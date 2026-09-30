import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { DN, FontFamily, FontSize, Space, Radius } from '@/constants/design-tokens';

type SkillTagProps = {
  label: string;
  color?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
};

/**
 * Compact colored pill for displaying a technology or skill name.
 * Used in project cards, portfolio listing, project detail, and skill DNA.
 */
export function SkillTag({
  label,
  color = DN.cyan,
  size = 'sm',
  style,
}: SkillTagProps) {
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: hexToRgba(color, 0.12),
          borderColor: hexToRgba(color, 0.25),
        },
        isSmall ? styles.sm : styles.md,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color },
          isSmall ? styles.labelSm : styles.labelMd,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

// Utility: convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: Space.sm,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: Space.md,
    paddingVertical: Space.xs,
  },
  label: {
    fontFamily: FontFamily.mono,
    fontWeight: '600',
  },
  labelSm: {
    fontSize: FontSize.xs,
  },
  labelMd: {
    fontSize: FontSize.sm,
  },
});
