import React, { useRef } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing } from '@/constants/theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
};

export function Input({ label, error, containerStyle, leftIcon, style, ...props }: Props) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithIcon : null, style]}
          placeholderTextColor={Colors.text.muted}
          selectionColor={Colors.accent.cyan}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    color: Colors.text.secondary,
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass.white8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    height: 52,
  },
  inputError: {
    borderColor: Colors.status.error,
  },
  icon: {
    paddingLeft: Spacing.md,
  },
  input: {
    flex: 1,
    color: Colors.text.primary,
    fontFamily: Typography.body,
    fontSize: 16,
    paddingHorizontal: Spacing.md,
    height: '100%',
  },
  inputWithIcon: {
    paddingLeft: Spacing.sm,
  },
  errorText: {
    color: Colors.status.error,
    fontFamily: Typography.body,
    fontSize: 12,
  },
});
