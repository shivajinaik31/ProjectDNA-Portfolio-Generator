import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { DN, FontFamily, FontSize, Space } from '@/constants/design-tokens';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

type AvatarDisplayProps = {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
};

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 80,
};

const fontSizeMap: Record<AvatarSize, number> = {
  sm: 14,
  md: 18,
  lg: 26,
  xl: 32,
};

/**
 * Avatar with image or fallback initial.
 * Cyan border ring for the dark aesthetic.
 */
export function AvatarDisplay({
  uri,
  name = '',
  size = 'md',
  style,
}: AvatarDisplayProps) {
  const dimension = sizeMap[size];
  const initial = name.charAt(0).toUpperCase() || '?';

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, containerStyle, style] as any}
      />
    );
  }

  return (
    <View style={[styles.fallback, containerStyle, style]}>
      <Text style={[styles.initial, { fontSize: fontSizeMap[size] }]}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderWidth: 2,
    borderColor: DN.cyan,
  },
  fallback: {
    backgroundColor: DN.cyanMuted,
    borderWidth: 2,
    borderColor: DN.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: FontFamily.extraBold,
    color: DN.cyan,
  },
});
