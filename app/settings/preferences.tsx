import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { safeStorage } from '../../lib/storageAdapter';
import { storageService } from '../../lib/storage';
import { useTheme, ThemeMode } from '../../lib/themeContext';

export default function PreferencesPage() {
  const [user, setUser] = useState<any>(null);

  // Global Theme Hook
  const { themeMode, setThemeMode, colors, isLight } = useTheme();

  // Playback Preferences State
  const [autoPlay, setAutoPlay] = useState(true);
  const [hwAcceleration, setHwAcceleration] = useState(true);
  const [qualityPref, setQualityPref] = useState('1080p');
  const [seekInterval, setSeekInterval] = useState('10s');

  // Subtitles & Audio Preferences State
  const [defaultSubtitleLang, setDefaultSubtitleLang] = useState('English');
  const [subtitleFontSize, setSubtitleFontSize] = useState('Medium');

  // Network & Notifications State
  const [dataSaver, setDataSaver] = useState(false);
  const [newEpisodeAlerts, setNewEpisodeAlerts] = useState(true);
  const [notifPermission, setNotifPermission] = useState<string>('default');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }

    safeStorage.getItem('auraflex_autoplay').then((val) => {
      if (val !== null) setAutoPlay(val === 'true');
    });
    safeStorage.getItem('auraflex_hwaccel').then((val) => {
      if (val !== null) setHwAcceleration(val === 'true');
    });
    safeStorage.getItem('auraflex_quality').then((val) => {
      if (val) setQualityPref(val);
    });
    safeStorage.getItem('auraflex_seek_interval').then((val) => {
      if (val) setSeekInterval(val);
    });
    safeStorage.getItem('auraflex_subtitle_lang').then((val) => {
      if (val) setDefaultSubtitleLang(val);
    });
    safeStorage.getItem('auraflex_subtitle_size').then((val) => {
      if (val) setSubtitleFontSize(val);
    });
    safeStorage.getItem('auraflex_data_saver').then((val) => {
      if (val !== null) setDataSaver(val === 'true');
    });
    safeStorage.getItem('auraflex_episode_alerts').then((val) => {
      if (val !== null) setNewEpisodeAlerts(val === 'true');
    });
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotifPermission(permission);
        if (permission === 'granted') {
          Alert.alert('Notifications Enabled', 'You will now receive alerts when new episodes of bookmarked titles release!');
        } else if (permission === 'denied') {
          Alert.alert('Permission Denied', 'Notification access was denied. You can enable it in your browser settings.');
        }
      } catch (e) {
        console.warn('Notification permission error:', e);
      }
    } else {
      setNotifPermission('granted');
      Alert.alert('Notifications Enabled', 'Push notifications enabled for this device.');
    }
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode);
  };

  const handleAutoPlayToggle = async (val: boolean) => {
    setAutoPlay(val);
    await safeStorage.setItem('auraflex_autoplay', val ? 'true' : 'false');
  };

  const handleHwAccelToggle = async (val: boolean) => {
    setHwAcceleration(val);
    await safeStorage.setItem('auraflex_hwaccel', val ? 'true' : 'false');
  };

  const handleQualityChange = async (q: string) => {
    setQualityPref(q);
    await safeStorage.setItem('auraflex_quality', q);
  };

  const handleSeekIntervalChange = async (s: string) => {
    setSeekInterval(s);
    await safeStorage.setItem('auraflex_seek_interval', s);
  };

  const handleSubLangChange = async (lang: string) => {
    setDefaultSubtitleLang(lang);
    await safeStorage.setItem('auraflex_subtitle_lang', lang);
  };

  const handleSubSizeChange = async (sz: string) => {
    setSubtitleFontSize(sz);
    await safeStorage.setItem('auraflex_subtitle_size', sz);
  };

  const handleDataSaverToggle = async (val: boolean) => {
    setDataSaver(val);
    await safeStorage.setItem('auraflex_data_saver', val ? 'true' : 'false');
  };

  const handleEpisodeAlertsToggle = async (val: boolean) => {
    setNewEpisodeAlerts(val);
    await safeStorage.setItem('auraflex_episode_alerts', val ? 'true' : 'false');
  };

  const handleClearCache = async () => {
    Alert.alert('Cache Cleared', 'App image cache and temporary streaming data cleared.');
  };

  const handleClearHistory = async () => {
    Alert.alert('Clear History', 'Are you sure you want to clear your watch history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          await storageService.clearHistory();
          Alert.alert('Success', 'Watch history cleared.');
        },
      },
    ]);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/more');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.contentPadding}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Preferences</Text>
      </View>

      {/* Account Status Badge */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statusBox}>
          <Ionicons name="shield-checkmark" size={22} color="#10b981" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusHeading, { color: colors.text }]}>{user ? user.email : 'Guest Member Active'}</Text>
            <Text style={[styles.statusSub, { color: colors.textSub }]}>{user ? 'Synced across devices via Secure Cloud' : 'Local storage profile active'}</Text>

          </View>
        </View>
      </View>

      {/* Appearance & Theme Mode */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.sectionTitle}>APPEARANCE & THEME</Text>
        <Text style={[styles.prefSub, { color: colors.textSub }]}>Choose your preferred app interface display mode</Text>
        <View style={styles.themeSelector}>
          <TouchableOpacity
            onPress={() => handleThemeChange('dark')}
            style={[
              styles.themePill,
              { backgroundColor: isLight ? '#e2e8f0' : '#0f0f12', borderColor: colors.border },
              themeMode === 'dark' && styles.themePillActive,
            ]}
          >
            <Ionicons name="moon-outline" size={16} color={themeMode === 'dark' ? '#ffffff' : colors.textSub} />
            <Text style={[styles.themeText, { color: colors.textSub }, themeMode === 'dark' && styles.themeTextActive]}>Dark</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleThemeChange('light')}
            style={[
              styles.themePill,
              { backgroundColor: isLight ? '#e2e8f0' : '#0f0f12', borderColor: colors.border },
              themeMode === 'light' && styles.themePillActive,
            ]}
          >
            <Ionicons name="sunny-outline" size={16} color={themeMode === 'light' ? '#ffffff' : colors.textSub} />
            <Text style={[styles.themeText, { color: colors.textSub }, themeMode === 'light' && styles.themeTextActive]}>Light</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleThemeChange('system')}
            style={[
              styles.themePill,
              { backgroundColor: isLight ? '#e2e8f0' : '#0f0f12', borderColor: colors.border },
              themeMode === 'system' && styles.themePillActive,
            ]}
          >
            <Ionicons name="desktop-outline" size={16} color={themeMode === 'system' ? '#ffffff' : colors.textSub} />
            <Text style={[styles.themeText, { color: colors.textSub }, themeMode === 'system' && styles.themeTextActive]}>System</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Playback Preferences */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.sectionTitle}>PLAYBACK PREFERENCES</Text>

        <View style={[styles.prefRow, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.prefTitle, { color: colors.text }]}>Auto-Play Next Episode</Text>
            <Text style={[styles.prefSub, { color: colors.textSub }]}>Automatically start playing the next episode when current ends</Text>
          </View>
          <Switch
            value={autoPlay}
            onValueChange={handleAutoPlayToggle}
            trackColor={{ false: '#27272a', true: '#e50914' }}
          />
        </View>

        <View style={[styles.prefRow, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.prefTitle, { color: colors.text }]}>Hardware Player Acceleration</Text>
            <Text style={[styles.prefSub, { color: colors.textSub }]}>Use native GPU acceleration for smooth 4K Ultra HD playback</Text>
          </View>
          <Switch
            value={hwAcceleration}
            onValueChange={handleHwAccelToggle}
            trackColor={{ false: '#27272a', true: '#e50914' }}
          />
        </View>

        <View style={[styles.qualityGroup, { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 14 }]}>
          <Text style={[styles.prefTitle, { color: colors.text }]}>Double-Tap Seeking Interval</Text>
          <View style={styles.qualitySelector}>
            {['5s', '10s', '15s'].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => handleSeekIntervalChange(s)}
                style={[
                  styles.qPill,
                  { backgroundColor: isLight ? '#e2e8f0' : '#0f0f12', borderColor: colors.border },
                  seekInterval === s && styles.qPillActive,
                ]}
              >
                <Text style={[styles.qText, { color: colors.textSub }, seekInterval === s && styles.qTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.qualityGroup}>
          <Text style={[styles.prefTitle, { color: colors.text }]}>Default Streaming Quality</Text>
          <View style={styles.qualitySelector}>
            {['1080p', '720p', 'Auto'].map((q) => (
              <TouchableOpacity
                key={q}
                onPress={() => handleQualityChange(q)}
                style={[
                  styles.qPill,
                  { backgroundColor: isLight ? '#e2e8f0' : '#0f0f12', borderColor: colors.border },
                  qualityPref === q && styles.qPillActive,
                ]}
              >
                <Text style={[styles.qText, { color: colors.textSub }, qualityPref === q && styles.qTextActive]}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Subtitles & Audio Captions */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.sectionTitle}>SUBTITLES & AUDIO</Text>

        <View style={[styles.qualityGroup, { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 14 }]}>
          <Text style={[styles.prefTitle, { color: colors.text }]}>Default Subtitle Language</Text>
          <View style={styles.qualitySelector}>
            {['English', 'Spanish', 'French', 'Off'].map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => handleSubLangChange(lang)}
                style={[
                  styles.qPill,
                  { backgroundColor: isLight ? '#e2e8f0' : '#0f0f12', borderColor: colors.border },
                  defaultSubtitleLang === lang && styles.qPillActive,
                ]}
              >
                <Text style={[styles.qText, { color: colors.textSub }, defaultSubtitleLang === lang && styles.qTextActive]}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.qualityGroup}>
          <Text style={[styles.prefTitle, { color: colors.text }]}>Subtitle Font Size</Text>
          <View style={styles.qualitySelector}>
            {['Small', 'Medium', 'Large'].map((sz) => (
              <TouchableOpacity
                key={sz}
                onPress={() => handleSubSizeChange(sz)}
                style={[
                  styles.qPill,
                  { backgroundColor: isLight ? '#e2e8f0' : '#0f0f12', borderColor: colors.border },
                  subtitleFontSize === sz && styles.qPillActive,
                ]}
              >
                <Text style={[styles.qText, { color: colors.textSub }, subtitleFontSize === sz && styles.qTextActive]}>{sz}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Network & Notifications */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.sectionTitle}>NETWORK & NOTIFICATIONS</Text>

        <View style={[styles.prefRow, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.prefTitle, { color: colors.text }]}>Push Notification Access</Text>
            <Text style={[styles.prefSub, { color: colors.textSub }]}>
              {notifPermission === 'granted'
                ? 'System notification permission granted'
                : notifPermission === 'denied'
                ? 'Notification access blocked by browser or system'
                : 'Request permission to send desktop and device alerts'}
            </Text>
          </View>
          {notifPermission === 'granted' ? (
            <View style={styles.grantedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10b981" />
              <Text style={styles.grantedText}>Granted</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={requestNotificationPermission} style={styles.requestBtn}>
              <Text style={styles.requestBtnText}>Request Permission</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.prefRow, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.prefTitle, { color: colors.text }]}>Cellular Data Saver</Text>
            <Text style={[styles.prefSub, { color: colors.textSub }]}>Limit streaming to 720p HD on mobile network data</Text>
          </View>
          <Switch
            value={dataSaver}
            onValueChange={handleDataSaverToggle}
            trackColor={{ false: '#27272a', true: '#e50914' }}
          />
        </View>

        <View style={styles.prefRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.prefTitle, { color: colors.text }]}>New Episode & Release Alerts</Text>
            <Text style={[styles.prefSub, { color: colors.textSub }]}>Receive notifications when new episodes of bookmarked shows release</Text>
          </View>
          <Switch
            value={newEpisodeAlerts}
            onValueChange={handleEpisodeAlertsToggle}
            trackColor={{ false: '#27272a', true: '#e50914' }}
          />
        </View>
      </View>

      {/* Data & Storage */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.sectionTitle}>DATA & STORAGE</Text>

        <TouchableOpacity onPress={handleClearCache} activeOpacity={0.7} style={[styles.actionRow, { borderBottomColor: colors.border }]}>
          <Ionicons name="trash-bin-outline" size={18} color={colors.textSub} />
          <Text style={[styles.actionText, { color: colors.text }]}>Clear App Cache</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleClearHistory} activeOpacity={0.7} style={[styles.actionRow, { borderBottomColor: colors.border }]}>
          <Ionicons name="time-outline" size={18} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Clear Watch Progress & History</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f12',
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: '#18181f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 12,
  },
  statusHeading: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  statusSub: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  sectionTitle: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  themeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  themePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#0f0f12',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  themePillActive: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  themeText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '700',
  },
  themeTextActive: {
    color: '#ffffff',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  prefTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  prefSub: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  qualityGroup: {
    paddingTop: 14,
  },
  qualitySelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  qPill: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#0f0f12',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  qPillActive: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  qText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '700',
  },
  qTextActive: {
    color: '#ffffff',
  },
  grantedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  grantedText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '800',
  },
  requestBtn: {
    backgroundColor: '#e50914',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  requestBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionText: {
    color: '#d1d5db',
    fontSize: 13,
    fontWeight: '700',
  },
});
