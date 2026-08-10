import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, Alert } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

interface MenuItem {
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  action?: () => void;
  url?: string;
  isExternal?: boolean;
}

export default function MoreScreen() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
      setUser(null);
      Alert.alert('Signed Out', 'You have been signed out successfully.');
      router.replace('/');
    } catch {
      router.replace('/');
    }
  };

  const menuItems: MenuItem[] = [
    { title: 'Account Settings', iconName: 'person-outline', action: () => router.push('/settings/account') },
    { title: 'Watch History', iconName: 'time-outline', action: () => router.push('/history') },
    { title: 'Downloads', iconName: 'download-outline', action: () => Alert.alert('Offline Downloads', 'Offline downloads are enabled on Android app build.') },
    { title: 'Streaming Services', iconName: 'tv-outline', action: () => Alert.alert('Streaming Services', 'HD, English, and Indian server mirrors are active.') },
    { title: 'TV Pairing', iconName: 'hardware-chip-outline', action: () => Alert.alert('TV Pairing', 'Chromecast and Smart TV pairing ready via player controls.') },
    { title: 'Help & Support', iconName: 'help-circle-outline', action: () => Alert.alert('Help & Support', 'Visit https://t.me/your_telegram_channel for live 24/7 support.') },
    { title: 'About AuraFlex', iconName: 'information-circle-outline', action: () => Alert.alert('About AuraFlex', 'AuraFlex v1.0.0 - Premium High Definition Cinema & Web Series Streaming.') },
    { title: 'Join Community', iconName: 'paper-plane-outline', url: 'https://t.me/your_telegram_channel', isExternal: true },
  ];

  const handleItemPress = (item: MenuItem) => {
    if (item.isExternal && item.url) {
      Linking.openURL(item.url).catch(() => {});
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>More</Text>

      {user && (
        <View style={styles.userCard}>
          <Ionicons name="person-circle" size={40} color="#e50914" />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.email}</Text>
            <Text style={styles.userStatus}>Premium Member</Text>
          </View>
        </View>
      )}

      <View style={styles.menuGroup}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}
            style={styles.menuItem}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.iconName} size={20} color="#d1d5db" />
              <Text style={styles.menuItemTitle}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#6b7280" />
          </TouchableOpacity>
        ))}

        {/* Sign Out Action Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.7}
          style={styles.signOutBtn}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(239, 68, 68, 0.6)" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f12',
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181f',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
    gap: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  userStatus: {
    color: '#e50914',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  menuGroup: {
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#18181f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuItemTitle: {
    color: '#f3f4f6',
    fontSize: 14,
    fontWeight: '600',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginTop: 12,
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '800',
  },
});
