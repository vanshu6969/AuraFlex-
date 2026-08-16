import React, { useState, useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';

import * as Updates from 'expo-updates';

import { AuthModal } from '../components/AuthModal';
import { DisclaimerModal } from '../components/DisclaimerModal';
import { useAntiNewTab } from '../lib/antiNewTab';
import { ThemeProvider, useTheme } from '../lib/themeContext';
import { notificationService } from '../lib/notificationService';
import { storageService } from '../lib/storage';
import { supabase } from '../lib/supabase';

function useAutoUpdate() {
  useEffect(() => {
    async function onFetchUpdateAsync() {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log(`Auto update check error: ${error}`);
      }
    }
    onFetchUpdateAsync();
  }, []);
}

function RootContent() {
  useAntiNewTab();
  useAutoUpdate();
  const [authVisible, setAuthVisible] = useState(false);
  const { colors, isLight } = useTheme();

  useEffect(() => {
    notificationService.scheduleEngagingNotifications();
    const interval = setInterval(() => {
      notificationService.scheduleEngagingNotifications();
    }, 15 * 60 * 1000);

    storageService.syncLocalToSupabase();
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        storageService.syncLocalToSupabase();
      }
    });

    return () => {
      clearInterval(interval);
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={isLight ? 'dark' : 'light'} />
      <SafeAreaView style={[styles.topSafeArea, { backgroundColor: colors.headerBg }]}>
        <View style={[styles.topHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.replace('/')} activeOpacity={0.7} style={styles.brandRow}>
            <Image source={require('../assets/icon.png')} style={styles.brandIconImage} />
            <Text style={[styles.brandTitle, { color: colors.text }]}>
              AURA <Text style={styles.brandAccent}>FLEX</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="watch/[type]/[id]" options={{ presentation: 'fullScreenModal' }} />
      </Stack>

      <AuthModal visible={authVisible} onClose={() => setAuthVisible(false)} />
      <DisclaimerModal />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSafeArea: {
    backgroundColor: '#18181f',
  },
  topHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  brandAccent: {
    color: '#e50914',
  },
});
