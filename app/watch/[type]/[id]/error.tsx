'use client';

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function WatchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Watch Error Boundary caught exception]:', error);
  }, [error]);

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleOpenExternalBrowser = () => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      const cleanUrl = currentUrl.replace(/^https?:\/\//, '');
      const chromeIntentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      
      try {
        window.location.href = chromeIntentUrl;
      } catch {
        window.open(currentUrl, '_system');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>⚠️</Text>
        </View>
        <Text style={styles.title}>Playback Restricted</Text>
        <Text style={styles.subtitle}>
          Your in-app browser sandbox restricted media playback or local storage. For uninterrupted 1080p streaming, tap below to open in Chrome or Brave.
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={handleOpenExternalBrowser} activeOpacity={0.8} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>⚡ Open in Chrome / External Browser</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => reset()} activeOpacity={0.8} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Retry Playback</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleReload} activeOpacity={0.8} style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>Reload Page</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 450,
    backgroundColor: '#0b0c0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    maxWidth: 440,
    width: '100%',
    backgroundColor: '#0f1015',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  buttonRow: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#e50914',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: '#9ca3af',
    fontSize: 12,
  },
});
