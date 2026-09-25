import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DN, FontFamily, FontSize, Space, Radius } from '@/constants/design-tokens';

type FormInputProps = TextInputProps & {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  error?: string;
  containerStyle?: ViewStyle;
  rightElement?: React.ReactNode;
};

export function FormInput({
  label,
  icon,
  error,
  containerStyle,
  rightElement,
  ...inputProps
}: FormInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
        {icon && (
          <Feather
            name={icon}
            size={18}
            color={DN.textMuted}
            style={styles.icon}
          />
        )}
        <TextInput
          style={styles.textInput}
          placeholderTextColor={DN.textPlaceholder}
          selectionColor={DN.cyan}
          {...inputProps}
        />
        {rightElement}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Space.base,
  },
  label: {
    fontSize: FontSize.xs + 1,
    fontFamily: FontFamily.mono,
    fontWeight: '700',
    color: DN.textLabel,
    letterSpacing: 1,
    marginBottom: Space.xs + 2,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DN.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: DN.borderLight,
    paddingHorizontal: Space.md,
    height: 48,
  },
  inputWrapperError: {
    borderColor: DN.error,
  },
  icon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: DN.textPrimary,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
  },
  errorText: {
    color: DN.errorText,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    marginTop: Space.xs,
  },
});
