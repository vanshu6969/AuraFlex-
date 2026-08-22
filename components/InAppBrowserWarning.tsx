import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

export const InAppBrowserWarning = () => {
  const [isInApp, setIsInApp] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const ua = (navigator.userAgent || navigator.vendor || '').toLowerCase();
      // Detect Telegram, Instagram, Facebook, Line, Discord, Reddit, Twitter, WeChat
      const isWebView = /fban|fbav|instagram|telegram|line|micromessenger|discord|twitter|reddit/i.test(ua);
      
      if (isWebView) {
        setIsInApp(true);
      }
    } catch (err) {
      console.warn('[InAppBrowserWarning UA detection error]', err);
    }
  }, []);

  if (!isInApp || dismissed) return null;

  const openInNativeBrowser = () => {
    if (typeof window === 'undefined') return;
    const currentUrl = window.location.href;
    const cleanUrl = currentUrl.replace(/^https?:\/\//, '');

    // Android Chrome Intent URL to launch standalone Chrome browser directly
    const chromeIntentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;

    try {
      window.location.href = chromeIntentUrl;
    } catch {
      try {
        window.open(currentUrl, '_system');
      } catch {
        window.open(currentUrl, '_blank');
      }
    }
  };

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.contentRow}>
        <Text style={styles.bannerText}>
          💡 For uninterrupted 1080p playback, open in Chrome or Brave.
        </Text>
        
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={openInNativeBrowser} activeOpacity={0.8} style={styles.openBtn}>
            <Text style={styles.openBtnText}>Open Chrome</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setDismissed(true)} activeOpacity={0.6} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: 'rgba(127, 29, 29, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.35)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 9999,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  bannerText: {
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openBtn: {
    backgroundColor: '#e50914',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  openBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: 'rgba(254, 202, 202, 0.7)',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
