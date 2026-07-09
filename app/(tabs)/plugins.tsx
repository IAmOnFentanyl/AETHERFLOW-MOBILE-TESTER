import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography } from '@/constants/theme';

export default function PluginsScreen() {
  return (
    <View style={styles.root}>
      <LinearGradient colors={[Colors.bg.deep, Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <Text style={styles.title}>Plugins</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSizes.xxl,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeights.bold,
  },
});
