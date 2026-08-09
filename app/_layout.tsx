import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { AuthModal } from '../components/AuthModal';

export default function RootLayout() {
  const [authVisible, setAuthVisible] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.topSafeArea}>
        <View style={styles.topHeader}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Ionicons name="play" size={14} color="#ffffff" />
            </View>
            <Text style={styles.brandTitle}>
              VEGA <Text style={styles.brandAccent}>CINEMA</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={() => setAuthVisible(true)} style={styles.userBtn}>
            <Ionicons name="person-circle-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f0f12' } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="watch/[type]/[id]" options={{ presentation: 'fullScreenModal' }} />
      </Stack>

      <AuthModal visible={authVisible} onClose={() => setAuthVisible(false)} />
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
  logoBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#e50914',
    alignItems: 'center',
    justifyContent: 'center',
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
