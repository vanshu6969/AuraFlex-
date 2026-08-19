import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { useTheme } from '../../lib/themeContext';
import { AuthModal } from '../../components/AuthModal';
import { ReportRequestModal } from '../../components/ReportRequestModal';
import { AboutModal } from '../../components/AboutModal';
import { PlaybackSettingsModal } from '../../components/PlaybackSettingsModal';



export default function MoreScreen() {
  const [user, setUser] = useState<any>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showProvidersModal, setShowProvidersModal] = useState(false);
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
      if (Platform.OS === 'web') {
        alert('Signed Out: You have been signed out successfully.');
      } else {
        Alert.alert('Signed Out', 'You have been signed out successfully.');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      setUser(null);
    }
  };

  const openModalWithTab = (tab: 'report' | 'request') => {
    setReportRequestTab(tab);
    setShowReportRequestModal(true);
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.contentPadding}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.headerTitle, { color: colors.text }]}>Settings & Account</Text>

      {/* 1. Account Profile Card or Guest Sync Card */}
      {user ? (
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {user.email}
            </Text>
            <View style={styles.syncBadgeRow}>
              <View style={styles.greenPulseDot} />
              <Text style={styles.syncBadgeText}>Cloud Sync Active</Text>
            </View>

          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setShowAuthModal(true)}
          activeOpacity={0.85}
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

      {/* 2. Featured Action Card: Report or Request */}
      <TouchableOpacity
        onPress={() => openModalWithTab('report')}
        activeOpacity={0.88}
        style={styles.featuredActionCard}
      >
        <View style={styles.featuredIconPod}>
          <Ionicons name="megaphone" size={20} color="#e50914" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.featuredTitle}>Report or Request Media</Text>
          <Text style={styles.featuredSub}>Request missing titles or report broken servers</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      </TouchableOpacity>

      {/* 3. Section Group 1: Media & Preferences */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeaderTitle}>MEDIA & PREFERENCES</Text>
        <View style={styles.cardGroup}>
          <TouchableOpacity
            onPress={() => router.push('/history')}
            activeOpacity={0.75}
            style={styles.groupRowItem}
          >
            <View style={styles.rowIconPod}>
              <Ionicons name="time-outline" size={18} color="#38bdf8" />
            </View>
            <View style={styles.rowTextGroup}>
              <Text style={styles.rowTitle}>Watch History</Text>
              <Text style={styles.rowSub}>Resume watching & clear progress log</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            onPress={() => router.push('/settings/preferences' as any)}
            activeOpacity={0.75}
            style={styles.groupRowItem}
          >
            <View style={styles.rowIconPod}>
              <Ionicons name="options-outline" size={18} color="#a855f7" />
            </View>
            <View style={styles.rowTextGroup}>
              <Text style={styles.rowTitle}>Playback Preferences</Text>
              <Text style={styles.rowSub}>Default server, video quality & captions</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          {user?.email?.toLowerCase() === 'tajinderyt1@gmail.com' && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                onPress={() => router.push('/admin/streams' as any)}
                activeOpacity={0.75}
                style={styles.groupRowItem}
              >
                <View style={styles.rowIconPod}>
                  <Ionicons name="hardware-chip-outline" size={18} color="#e50914" />
                </View>
                <View style={styles.rowTextGroup}>
                  <Text style={styles.rowTitle}>Stream Link Overrides</Text>
                  <Text style={styles.rowSub}>Replace broken server links via Cloud DB</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </TouchableOpacity>
            </>
          )}



          <TouchableOpacity
            onPress={() => setShowProvidersModal(true)}
            activeOpacity={0.75}
            style={styles.groupRowItem}
          >
            <View style={styles.rowIconPod}>
              <Ionicons name="tv-outline" size={18} color="#10b981" />
            </View>
            <View style={styles.rowTextGroup}>
              <Text style={styles.rowTitle}>Streaming Providers</Text>
              <Text style={styles.rowSub}>Explore integrated embed mirrors & sources</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Section Group 2: System & Ecosystem */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeaderTitle}>SYSTEM & ECOSYSTEM</Text>
        <View style={styles.cardGroup}>
          <TouchableOpacity
            onPress={() =>
              Platform.OS === 'web'
                ? alert('TV Pairing: Chromecast & Smart TV pairing ready via player controls.')
                : Alert.alert('TV Pairing', 'Chromecast and Smart TV pairing ready via player controls.')
            }
            activeOpacity={0.75}
            style={styles.groupRowItem}
          >
            <View style={styles.rowIconPod}>
              <Ionicons name="hardware-chip-outline" size={18} color="#f59e0b" />
            </View>
            <View style={styles.rowTextGroup}>
              <Text style={styles.rowTitle}>TV Pairing & Remote Cast</Text>
              <Text style={styles.rowSub}>Smart TV, DLNA & Chromecast setup</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            onPress={() => setShowAboutModal(true)}
            activeOpacity={0.75}
            style={styles.groupRowItem}
          >
            <View style={styles.rowIconPod}>
              <Ionicons name="information-circle-outline" size={18} color="#ec4899" />
            </View>
            <View style={styles.rowTextGroup}>
              <Text style={styles.rowTitle}>About AuraFlex</Text>
              <Text style={styles.rowSub}>App version v1.0.0, terms & legal info</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Clean Red Outline Sign Out Action */}
      {user && (
        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.8}
          style={styles.signOutBtn}
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out of AuraFlex</Text>
        </TouchableOpacity>
      )}

      {/* Auth Modal */}
      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Report or Request Modal */}
      <ReportRequestModal
        visible={showReportRequestModal}
        onClose={() => setShowReportRequestModal(false)}
        initialTab={reportRequestTab}
      />

      {/* About Modal */}
      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />


      {/* Playback & Player Engine Settings Modal */}
      <PlaybackSettingsModal isOpen={showProvidersModal} onClose={() => setShowProvidersModal(false)} />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c0f',
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 90,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12141a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 14,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e50914',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileEmail: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  syncBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  greenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  syncBadgeText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  guestCard: {
    backgroundColor: '#12141a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  guestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  guestIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  guestSub: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  signInBadge: {
    backgroundColor: '#e50914',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  signInBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  featuredActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12141a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.35)',
    gap: 14,
    marginBottom: 20,
  },
  featuredIconPod: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  featuredSub: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: '#12141a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  groupRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  rowIconPod: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextGroup: {
    flex: 1,
  },
  rowTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  rowSub: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10,
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#12141a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  modalSub: {
    color: '#e50914',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  modalBody: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  providerList: {
    marginTop: 14,
    alignSelf: 'stretch',
    gap: 6,
  },
  providerItem: {
    color: '#d1d5db',
    fontSize: 13,
  },
  modalCloseBtn: {
    backgroundColor: '#e50914',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
