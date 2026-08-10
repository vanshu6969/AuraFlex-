import React, { useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { AuthModal } from '../components/AuthModal';
import { DisclaimerModal } from '../components/DisclaimerModal';
import { UpdateModal } from '../components/UpdateModal';
import { OTAInitializer } from '../components/OTAInitializer';

export default function RootLayout() {
  const [authVisible, setAuthVisible] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.topSafeArea}>
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => router.replace('/')} activeOpacity={0.7} style={styles.brandRow}>
            <Image source={require('../assets/icon.png')} style={styles.brandIconImage} />
            <Text style={styles.brandTitle}>
              AURA <Text style={styles.brandAccent}>FLEX</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f0f12' } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="watch/[type]/[id]" options={{ presentation: 'fullScreenModal' }} />
      </Stack>

      <AuthModal visible={authVisible} onClose={() => setAuthVisible(false)} />
      <DisclaimerModal />
      <UpdateModal />
      <OTAInitializer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f12',
  },
  topSafeArea: {
    backgroundColor: '#0f0f12',
  },
  topHeader: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconImage: {
    width: 28,
    height: 28,
    borderRadius: 7,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandAccent: {
    color: '#e50914',
  },
  userBtn: {
    padding: 4,
  },
});
