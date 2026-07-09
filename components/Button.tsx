import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, BorderRadius, Spacing } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ label, onPress, variant = 'primary', loading, disabled, style, textStyle, size = 'md' }: Props) {
  const height = size === 'sm' ? 36 : size === 'md' ? 48 : 56;
  const fontSize = size === 'sm' ? 13 : size === 'md' ? 15 : 17;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[{ height, borderRadius: BorderRadius.md }, style]}
      >
        <LinearGradient
          colors={['#00F2FE', '#0062FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { height, borderRadius: BorderRadius.md, opacity: disabled ? 0.5 : 1 }]}
        >
          {loading
            ? <ActivityIndicator color={Colors.text.inverse} />
            : <Text style={[styles.primaryText, { fontSize }, textStyle]}>{label}</Text>
          }
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.secondary, { height, borderRadius: BorderRadius.md, opacity: disabled ? 0.5 : 1 }, style]}
      >
        {loading
          ? <ActivityIndicator color={Colors.accent.cyan} />
          : <Text style={[styles.secondaryText, { fontSize }, textStyle]}>{label}</Text>
        }
      </TouchableOpacity>
    );
  }

  if (variant === 'danger') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.danger, { height, borderRadius: BorderRadius.md, opacity: disabled ? 0.5 : 1 }, style]}
      >
        {loading
          ? <ActivityIndicator color={Colors.status.error} />
          : <Text style={[styles.dangerText, { fontSize }, textStyle]}>{label}</Text>
        }
      </TouchableOpacity>
    );
  }

  // ghost
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.6}
      style={[{ height, justifyContent: 'center', alignItems: 'center', opacity: disabled ? 0.4 : 1 }, style]}
    >
      {loading
        ? <ActivityIndicator color={Colors.text.secondary} />
        : <Text style={[styles.ghostText, { fontSize }, textStyle]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryText: {
    color: Colors.text.inverse,
    fontFamily: Typography.bodySemiBold,
    letterSpacing: 0.5,
  },
  secondary: {
    borderWidth: 1,
    borderColor: Colors.accent.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.accent.cyanGlow,
  },
  secondaryText: {
    color: Colors.accent.cyan,
    fontFamily: Typography.bodySemiBold,
    letterSpacing: 0.5,
  },
  danger: {
    borderWidth: 1,
    borderColor: Colors.status.error,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,68,68,0.1)',
  },
  dangerText: {
    color: Colors.status.error,
    fontFamily: Typography.bodySemiBold,
  },
  ghostText: {
    color: Colors.text.secondary,
    fontFamily: Typography.body,
  },
});
