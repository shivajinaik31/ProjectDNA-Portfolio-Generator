import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DN, FontFamily, FontSize, Space, Radius, Shadow } from '@/constants/design-tokens';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Feather.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
};

export function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}: PrimaryButtonProps) {
  const buttonStyles = variantStyles[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.base,
        buttonStyles.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={buttonStyles.loaderColor} />
      ) : (
        <>
          {icon && (
            <Feather
              name={icon}
              size={16}
              color={buttonStyles.iconColor}
              style={styles.icon}
            />
          )}
          <Text style={[styles.text, buttonStyles.text, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    height: 48,
    paddingHorizontal: Space.xl,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: Space.sm,
  },
  text: {
    fontSize: FontSize.base - 1,
    fontFamily: FontFamily.bold,
  },
});

const variantStyles = {
  primary: {
    container: {
      backgroundColor: DN.cyan,
      ...Shadow.button,
    } as ViewStyle,
    text: {
      color: DN.bg,
    } as TextStyle,
    iconColor: DN.bg,
    loaderColor: DN.bg,
  },
  secondary: {
    container: {
      backgroundColor: DN.cyanMuted,
      borderWidth: 1,
      borderColor: DN.borderFocus,
    } as ViewStyle,
    text: {
      color: DN.cyan,
    } as TextStyle,
    iconColor: DN.cyan,
    loaderColor: DN.cyan,
  },
  danger: {
    container: {
      backgroundColor: DN.errorBg,
      borderWidth: 1,
      borderColor: DN.errorBorder,
    } as ViewStyle,
    text: {
      color: DN.error,
    } as TextStyle,
    iconColor: DN.error,
    loaderColor: DN.error,
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: DN.border,
    } as ViewStyle,
    text: {
      color: DN.textSecondary,
    } as TextStyle,
    iconColor: DN.textSecondary,
    loaderColor: DN.textSecondary,
  },
};
