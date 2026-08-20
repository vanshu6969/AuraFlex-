import React, { useState, useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Analytics } from '@vercel/analytics/dist/react/index.js';
import { SpeedInsights } from '@vercel/speed-insights/dist/react/index.js';

import * as Updates from 'expo-updates';

import { AuraAuthModal, AuraAuthView } from '../components/AuraAuthModal';
import { DisclaimerModal } from '../components/DisclaimerModal';
import { CommandSearch } from '../components/CommandSearch';
import { ToastNotification } from '../components/ToastNotification';


import { useAntiNewTab } from '../lib/antiNewTab';
import { ThemeProvider, useTheme } from '../lib/themeContext';
import { notificationService } from '../lib/notificationService';
import { storageService } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { initSystemShield } from '../lib/systemShield';

function useAutoUpdate() {
  useEffect(() => {
    initSystemShield();

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }

    async function onFetchUpdateAsync() {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {}
    }
    onFetchUpdateAsync();
  }, []);
}


function RootContent() {
  useAntiNewTab();
  useAutoUpdate();
  const [authVisible, setAuthVisible] = useState(false);
  const [initialAuthView, setInitialAuthView] = useState<AuraAuthView>('SIGN_IN');
  const [commandSearchOpen, setCommandSearchOpen] = useState(false);
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

  const handleOpenAuth = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      setInitialAuthView('ACCOUNT');
    } else {
      setInitialAuthView('SIGN_IN');
    }
    setAuthVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={isLight ? 'dark' : 'light'} />
      <SafeAreaView style={[styles.topSafeArea, { backgroundColor: colors.headerBg }]}>
        <View style={[styles.topHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.replace('/')} activeOpacity={0.75} style={styles.brandRow}>
            <View style={styles.brandIconWrapper}>
              <Image source={require('../assets/icon.png')} style={styles.brandIconImage} resizeMode="cover" />
            </View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>
              AURA<Text style={styles.brandAccent}>FLEX</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.headerRightRow}>
            <TouchableOpacity onPress={() => setCommandSearchOpen(true)} activeOpacity={0.7} style={styles.headerIconButton}>
              <Ionicons name="search" size={18} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleOpenAuth} activeOpacity={0.7} style={styles.headerIconButton}>
              <Ionicons name="person-circle-outline" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="watch/[type]/[id]" options={{ presentation: 'fullScreenModal' }} />
      </Stack>

      <CommandSearch isOpen={commandSearchOpen} onClose={() => setCommandSearchOpen(false)} />
      <AuraAuthModal visible={authVisible} onClose={() => setAuthVisible(false)} initialView={initialAuthView} />
      <DisclaimerModal />
      <ToastNotification />
      {Platform.OS === 'web' && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
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
    backgroundColor: '#141419',
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
    gap: 10,
  },
  brandIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 9,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.5)',
    backgroundColor: '#0a0a0d',
  },
  brandIconImage: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  brandAccent: {
    color: '#e50914',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
