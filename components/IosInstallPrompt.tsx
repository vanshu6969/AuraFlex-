import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const IosInstallPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // 1. Check if already running in standalone PWA mode
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) {
      return;
    }

    // 2. Check if user is on an iOS device (iPhone, iPad, iPod)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);

    if (!isIosDevice) {
      return;
    }

    // 3. Check dismissal timestamp in localStorage (dismiss for 7 days)
    try {
      const dismissed = localStorage.getItem('@auraflex_ios_install_dismissed');
      if (dismissed) {
        const timestamp = parseInt(dismissed, 10);
        if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) {
          return;
        }
      }
    } catch {}

    // Show prompt for iOS Safari visitors
    setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('@auraflex_ios_install_dismissed', String(Date.now()));
    } catch {}
  };

  if (!isVisible || Platform.OS !== 'web') return null;

  return (
    <View style={styles.overlayContainer}>
      <View style={styles.bottomSheetCard}>
        {/* Top Accent Indicator */}
        <View style={styles.handleBar} />

        {/* Top Right Close Button */}
        <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color="#9ca3af" />
        </TouchableOpacity>

        {/* App Header Info */}
        <View style={styles.headerRow}>
          <View style={styles.iconBox}>
            <Image source={require('../assets/icon.png')} style={styles.appIcon} resizeMode="cover" />
          </View>

          <View style={styles.headerTextCol}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.titleText}>Install AuraFlex Movies</Text>
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText}>PWA iOS</Text>
              </View>
            </View>
            <Text style={styles.subtitleText}>
              Add to your iOS Home Screen for fast, full-screen 1080p HD streaming without browser bars.
            </Text>
          </View>
        </View>

        {/* Step-by-Step Instructions Box */}
        <View style={styles.stepsContainer}>
          {/* Step 1 */}
          <View style={styles.stepRow}>
            <View style={styles.stepIconBoxLeft}>
              <Ionicons name="share-outline" size={20} color="#38bdf8" />
            </View>
            <View style={styles.stepTextCol}>
              <Text style={styles.stepTitleText}>
                Step 1: Tap <Text style={{ color: '#38bdf8', fontWeight: '800' }}>Share</Text>
              </Text>
              <Text style={styles.stepSubText}>
                Tap the Share icon at the bottom of your Safari browser window.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Step 2 */}
          <View style={styles.stepRow}>
            <View style={styles.stepIconBoxRight}>
              <Ionicons name="add-circle-outline" size={20} color="#e50914" />
            </View>
            <View style={styles.stepTextCol}>
              <Text style={styles.stepTitleText}>
                Step 2: Tap <Text style={{ color: '#e50914', fontWeight: '800' }}>"Add to Home Screen"</Text>
              </Text>
              <Text style={styles.stepSubText}>
                Scroll down the share options list and select <Text style={{ color: '#ffffff', fontWeight: '700' }}>Add to Home Screen</Text>.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Dismiss Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={handleDismiss} style={styles.dismissBtn} activeOpacity={0.85}>
            <Text style={styles.dismissBtnText}>Got It! Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999999,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'web' ? 16 : 0,
  },
  bottomSheetCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#0b0c0f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: Platform.OS === 'web' ? 24 : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? 24 : 0,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.4)',
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
    position: 'relative',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
        } as any)
      : {}),
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: '#12131a',
  },
  appIcon: {
    width: '100%',
    height: '100%',
  },
  headerTextCol: {
    flex: 1,
    paddingRight: 24,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandBadge: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.4)',
  },
  brandBadgeText: {
    color: '#e50914',
    fontSize: 9,
    fontWeight: '900',
  },
  subtitleText: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  stepsContainer: {
    backgroundColor: '#12141c',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 16,
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIconBoxLeft: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  stepIconBoxRight: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
  },
  stepTextCol: {
    flex: 1,
  },
  stepTitleText: {
    color: '#f3f4f6',
    fontSize: 13,
    fontWeight: '700',
  },
  stepSubText: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dismissBtn: {
    width: '100%',
    backgroundColor: '#e50914',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  dismissBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
