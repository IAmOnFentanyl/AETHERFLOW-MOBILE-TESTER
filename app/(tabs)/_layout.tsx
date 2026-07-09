import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, FolderOpen, Music2, Puzzle, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg.primary,
          borderTopWidth: 1,
          borderTopColor: Colors.glass.white10,
          elevation: 0,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          height: 64 + insets.bottom,
        },
        tabBarActiveTintColor: Colors.accent.cyan,
        tabBarInactiveTintColor: Colors.text.muted,
        tabBarLabelStyle: {
          fontSize: Typography.fontSizes.xs,
          fontWeight: Typography.fontWeights.medium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color, size }) => <FolderOpen size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="studio"
        options={{
          title: 'Studio',
          tabBarIcon: ({ color, size }) => <Music2 size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="plugins"
        options={{
          title: 'Plugins',
          tabBarIcon: ({ color, size }) => <Puzzle size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size ?? 22} color={color} />,
        }}
      />
    </Tabs>
  );
}
