import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { useTheme } from '../../lib/themeContext';
import { AuthModal } from '../../components/AuthModal';
import { ReportRequestModal } from '../../components/ReportRequestModal';

interface MenuItem {
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  action?: () => void;
}

export default function MoreScreen() {
  const [user, setUser] = useState<any>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showProvidersModal, setShowProvidersModal] = useState(false);
  const [showDownloadsModal, setShowDownloadsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReportRequestModal, setShowReportRequestModal] = useState(false);
  const [reportRequestTab, setReportRequestTab] = useState<'report' | 'request'>('report');
  const { colors } = useTheme();

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
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('auraflex_user_session');
        window.localStorage.removeItem('auraflex_auth_token');
      }
      await supabase.auth.signOut();
      setUser(null);
      Alert.alert('Signed Out', 'You have been signed out successfully.');
    } catch (error) {
      console.error('Sign out error:', error);
      setUser(null);
    }
  };

  const openModalWithTab = (tab: 'report' | 'request') => {
    setReportRequestTab(tab);
    setShowReportRequestModal(true);
  };

  const menuItems: MenuItem[] = [
    { title: 'Report or Request Movie / Series', iconName: 'megaphone-outline', action: () => openModalWithTab('report') },
    { title: 'Preferences', iconName: 'options-outline', action: () => router.push('/settings/preferences' as any) },
    { title: 'Watch History', iconName: 'time-outline', action: () => router.push('/history') },
    { title: 'Downloads', iconName: 'download-outline', action: () => setShowDownloadsModal(true) },
    { title: 'Streaming Providers', iconName: 'tv-outline', action: () => setShowProvidersModal(true) },
    { title: 'TV Pairing', iconName: 'hardware-chip-outline', action: () => Alert.alert('TV Pairing', 'Chromecast and Smart TV pairing ready via player controls.') },
    { title: 'About AuraFlex', iconName: 'information-circle-outline', action: () => setShowAboutModal(true) },
  ];

  const handleItemPress = (item: MenuItem) => {
    if (item.action) {
      item.action();
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>More</Text>

      {/* Account Profile Card or Guest Banner */}
      {user ? (
        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="person-circle" size={42} color="#e50914" />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{user.email}</Text>
            <Text style={styles.userStatus}>Supabase Cloud Sync Active</Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setShowAuthModal(true)}
          activeOpacity={0.8}
          style={styles.guestCard}
        >
          <View style={styles.guestLeft}>
            <View style={styles.guestIconCircle}>
              <Ionicons name="cloud-upload-outline" size={22} color="#e50914" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guestTitle}>Sign In / Create Account</Text>
              <Text style={styles.guestSub}>Sync Watchlist & Progress Across Devices</Text>
            </View>
          </View>
          <View style={styles.signInBadge}>
            <Text style={styles.signInBadgeText}>Sign In</Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.menuGroup}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.iconName} size={20} color={item.title.includes('Report') ? '#e50914' : colors.textSub} />
              <Text style={[styles.menuItemTitle, { color: item.title.includes('Report') ? '#e50914' : colors.text }]}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSub} />
          </TouchableOpacity>
        ))}

        {user && (
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
        )}
      </View>

      {/* Supabase Authentication Modal */}
      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Report & Request Media Modal */}
      <ReportRequestModal
        visible={showReportRequestModal}
        onClose={() => setShowReportRequestModal(false)}
        initialTab={reportRequestTab}
      />

      {/* Downloads Modal */}
      <Modal
        visible={showDownloadsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDownloadsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: colors.bg }]}
              onPress={() => setShowDownloadsModal(false)}
            >
              <Ionicons name="close" size={22} color={colors.textSub} />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <View style={styles.logoBadge}>
                <Ionicons name="download-outline" size={28} color="#e50914" />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Offline Downloads</Text>
              <Text style={[styles.modalVersion, { color: '#e50914', fontWeight: '800' }]}>🚀 Coming Soon</Text>
            </View>

            <Text style={[styles.modalDescription, { color: colors.textSub }]}>
              Offline video downloading for offline playback will be unlocked in the next live update!
            </Text>
          </View>
        </View>
      </Modal>

      {/* Streaming Providers Modal */}
      <Modal
        visible={showProvidersModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProvidersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: colors.bg }]}
              onPress={() => setShowProvidersModal(false)}
            >
              <Ionicons name="close" size={22} color={colors.textSub} />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <View style={styles.logoBadge}>
                <Ionicons name="tv-outline" size={28} color="#e50914" />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Streaming Providers</Text>
              <Text style={[styles.modalVersion, { color: '#e50914', fontWeight: '800' }]}>🚀 Coming Soon</Text>
            </View>

            <Text style={[styles.modalDescription, { color: colors.textSub }]}>
              Additional 4K Ultra HD Premium Servers and multi-language provider mirrors will be unlocked in the next live update!
            </Text>
          </View>
        </View>
      </Modal>

      {/* About AuraFlex Modal */}
      <Modal
        visible={showAboutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: colors.bg }]}
              onPress={() => setShowAboutModal(false)}
            >
              <Ionicons name="close" size={22} color={colors.textSub} />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <View style={styles.logoBadge}>
                <Ionicons name="film" size={28} color="#e50914" />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>AuraFlex</Text>
              <Text style={[styles.modalVersion, { color: colors.textSub }]}>Version 1.0.0</Text>
            </View>

            <Text style={[styles.modalDescription, { color: colors.textSub }]}>
              AuraFlex is a high-performance cinema, TV series, and anime streaming platform designed to provide a premium viewing experience with anti-popup shields and multi-server playback.
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentPadding: {
    padding: 16,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
  },
  userStatus: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181f',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
    marginBottom: 20,
  },
  guestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  guestIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  guestSub: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  signInBadge: {
    backgroundColor: '#e50914',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  signInBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  menuGroup: {
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  modalVersion: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  modalDescription: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
