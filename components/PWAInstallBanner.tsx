import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Check if already in standalone app mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // Check dismissal status in localStorage
    try {
      const dismissed = localStorage.getItem('@auraflex_pwa_dismissed');
      if (dismissed) {
        const timestamp = parseInt(dismissed, 10);
        // Hide if dismissed less than 3 days ago
        if (Date.now() - timestamp < 3 * 24 * 60 * 60 * 1000) {
          return;
        }
      }
    } catch {}

    // Check iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      setShowBanner(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSTip(!showIOSTip);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      localStorage.setItem('@auraflex_pwa_dismissed', String(Date.now()));
    } catch {}
  };

  if (!showBanner || Platform.OS !== 'web') return null;

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.glassCard}>
        {/* Close Button */}
        <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={16} color="#9ca3af" />
        </TouchableOpacity>

        <View style={styles.row}>
          {/* App Icon */}
          <View style={styles.iconBox}>
            <Image source={require('../assets/icon.png')} style={styles.appIcon} resizeMode="cover" />
          </View>

          {/* Text Info */}
          <View style={styles.infoCol}>
            <View style={styles.titleRow}>
              <Text style={styles.titleText}>Install AuraFlex App</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>1-TAP</Text>
              </View>
            </View>
            <Text style={styles.subText}>
              Launch in full-screen standalone mode with no browser bar & fast 1080p streaming.
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity onPress={handleInstallClick} style={styles.installBtn} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={16} color="#ffffff" />
            <Text style={styles.installBtnText}>Install</Text>
          </TouchableOpacity>
        </View>

        {/* iOS Add to Home Screen Instructions Tooltip */}
        {showIOSTip && (
          <View style={styles.iosTipBox}>
            <Ionicons name="share-outline" size={18} color="#3b82f6" />
            <Text style={styles.iosTipText}>
              Tap the <Text style={{ fontWeight: '800', color: '#ffffff' }}>Share</Text> button in Safari below and select{' '}
              <Text style={{ fontWeight: '800', color: '#e50914' }}>"Add to Home Screen"</Text> to install AuraFlex.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
  },
  glassCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#12141c',
    borderRadius: 16,
    padding: 14,
    paddingRight: 32,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.35)',
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 11,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: '#0a0a0d',
  },
  appIcon: {
    width: '100%',
    height: '100%',
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  badge: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.4)',
  },
  badgeText: {
    color: '#e50914',
    fontSize: 9,
    fontWeight: '900',
  },
  subText: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  installBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e50914',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  installBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  iosTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  iosTipText: {
    color: '#d1d5db',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
});
