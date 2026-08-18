import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#e50914',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: 'rgba(11, 12, 15, 0.85)',
          borderTopColor: 'rgba(255, 255, 255, 0.05)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          position: Platform.OS === 'web' ? ('fixed' as any) : 'relative',
          bottom: 0,
          left: 0,
          right: 0,
          ...(Platform.OS === 'web'
            ? ({
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                backgroundColor: 'rgba(11, 12, 15, 0.8)',
              } as any)
            : {}),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size - 2} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="series"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={size - 2} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline'} size={size - 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

