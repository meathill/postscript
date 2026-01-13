import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import TabBarBackground from '@/components/ui/tab-bar-background';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="house.fill"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="recipients"
        options={{
          title: 'Recipients',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="person.2.fill"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="security"
        options={{
          href: null, // Hide from tab bar, accessed via settings or flow
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="gear"
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
