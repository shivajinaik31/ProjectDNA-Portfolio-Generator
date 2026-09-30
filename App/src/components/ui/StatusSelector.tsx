import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DN, FontFamily, FontSize, Space, Radius } from '@/constants/design-tokens';
import { ProjectStatus, PROJECT_STATUSES } from '@/lib/types';

type StatusSelectorProps = {
  value: ProjectStatus;
  onChange: (status: ProjectStatus) => void;
  disabled?: boolean;
};

export function StatusSelector({ value, onChange, disabled = false }: StatusSelectorProps) {
  const renderStatus = (status: ProjectStatus) => {
    const isSelected = value === status;
    
    let containerStyle, textStyle, icon;
    
    switch (status) {
      case 'active':
        containerStyle = isSelected ? styles.activeContainer : styles.unselectedContainer;
        textStyle = isSelected ? styles.activeText : styles.unselectedText;
        icon = 'play';
        break;
      case 'completed':
        containerStyle = isSelected ? styles.completedContainer : styles.unselectedContainer;
        textStyle = isSelected ? styles.completedText : styles.unselectedText;
        icon = 'check-circle';
        break;
      case 'archived':
        containerStyle = isSelected ? styles.archivedContainer : styles.unselectedContainer;
        textStyle = isSelected ? styles.archivedText : styles.unselectedText;
        icon = 'archive';
        break;
    }

    return (
      <TouchableOpacity
        key={status}
        style={[styles.statusChip, containerStyle, disabled && styles.disabled]}
        onPress={() => !disabled && onChange(status)}
        activeOpacity={0.7}
      >
        <Feather name={icon as any} size={14} color={textStyle.color} style={styles.icon} />
        <Text style={[styles.statusText, textStyle]}>{status}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {PROJECT_STATUSES.map(renderStatus)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Space.sm,
    flexWrap: 'wrap',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  icon: {
    marginRight: Space.xs,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    textTransform: 'capitalize',
  },
  disabled: {
    opacity: 0.5,
  },
  // Unselected State
  unselectedContainer: {
    backgroundColor: 'transparent',
    borderColor: DN.border,
  },
  unselectedText: {
    color: DN.textMuted,
  },
  // Active State
  activeContainer: {
    backgroundColor: DN.cyan + '1a', // 10% opacity
    borderColor: DN.cyan,
  },
  activeText: {
    color: DN.cyan,
  },
  // Completed State
  completedContainer: {
    backgroundColor: DN.successBg,
    borderColor: DN.success,
  },
  completedText: {
    color: DN.success,
  },
  // Archived State
  archivedContainer: {
    backgroundColor: DN.bgElevated,
    borderColor: DN.borderFocus,
  },
  archivedText: {
    color: DN.textSecondary,
  },
});
