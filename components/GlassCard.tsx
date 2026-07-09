import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius } from '@/constants/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: string;
  intensity?: 'low' | 'medium' | 'high';
};

export function GlassCard({ children, style, glowColor, intensity = 'low' }: Props) {
  const glowOpacity = intensity === 'low' ? 0.08 : intensity === 'medium' ? 0.15 : 0.25;
  const shadowColor = glowColor ?? Colors.accent.cyan;

  return (
    <View
      style={[
        styles.card,
        {
          shadowColor,
          shadowOpacity: glowOpacity,
          shadowRadius: intensity === 'low' ? 12 : intensity === 'medium' ? 20 : 32,
          elevation: intensity === 'low' ? 4 : intensity === 'medium' ? 8 : 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glass.white8,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
  },
});
