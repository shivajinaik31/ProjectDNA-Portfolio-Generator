import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DN, FontFamily, FontSize, Space } from '@/constants/design-tokens';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Feather.glyphMap;
};

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  icon,
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {icon && (
          <Feather
            name={icon}
            size={16}
            color={DN.cyan}
            style={styles.icon}
          />
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Space.md,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: Space.sm,
  },
  title: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: DN.textPrimary,
  },
  action: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: DN.cyan,
  },
});
