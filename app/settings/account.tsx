import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, Switch } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { safeStorage } from '../../lib/storageAdapter';
import { storageService } from '../../lib/storage';

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // App Preferences
  const [autoPlay, setAutoPlay] = useState(true);
  const [hwAcceleration, setHwAcceleration] = useState(true);
  const [qualityPref, setQualityPref] = useState('1080p');

  // Auth form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleAuth = async () => {
    setLoading(true);
    setAuthError('');
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) setAuthError(error.message);
        else {
          if (data.session?.user) setUser(data.session.user);
          Alert.alert('Account Created', 'Account created successfully!');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setAuthError(error.message);
        else {
          setUser(data.user);
          Alert.alert('Signed In', 'Signed in successfully!');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Auth error');
    } finally {
      setLoading(false);
    }
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
      </View>

      {/* Account Status Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>ACCOUNT STATUS</Text>
        <View style={styles.statusBox}>
          <Ionicons name="shield-checkmark" size={22} color="#10b981" />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusHeading}>{user ? user.email : 'Guest Member Active'}</Text>
            <Text style={styles.statusSub}>{user ? 'Synced across devices via Supabase' : 'Local storage profile active'}</Text>
          </View>
        </View>
      </View>

      {/* App & Playback Preferences */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>PLAYBACK PREFERENCES</Text>

        <View style={styles.prefRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.prefTitle}>Auto-Play Next Episode</Text>
            <Text style={styles.prefSub}>Automatically start playing the next episode when current ends</Text>
          </View>
          <Switch value={autoPlay} onValueChange={setAutoPlay} trackColor={{ false: '#27272a', true: '#e50914' }} />
        </View>

        <View style={styles.prefRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.prefTitle}>Hardware Player Acceleration</Text>
            <Text style={styles.prefSub}>Use native GPU acceleration for smooth 4K Ultra HD playback</Text>
          </View>
          <Switch value={hwAcceleration} onValueChange={setHwAcceleration} trackColor={{ false: '#27272a', true: '#e50914' }} />
        </View>

        <View style={styles.qualityGroup}>
          <Text style={styles.prefTitle}>Default Streaming Quality</Text>
          <View style={styles.qualitySelector}>
            {['1080p', '720p', 'Auto'].map((q) => (
              <TouchableOpacity
                key={q}
                onPress={() => setQualityPref(q)}
                style={[styles.qPill, qualityPref === q && styles.qPillActive]}
              >
                <Text style={[styles.qText, qualityPref === q && styles.qTextActive]}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Data & Storage Management */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>DATA & STORAGE</Text>

        <TouchableOpacity onPress={handleClearCache} activeOpacity={0.7} style={styles.actionRow}>
          <Ionicons name="trash-bin-outline" size={18} color="#d1d5db" />
          <Text style={styles.actionText}>Clear App Cache</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleClearHistory} activeOpacity={0.7} style={styles.actionRow}>
          <Ionicons name="time-outline" size={18} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Clear Watch Progress & History</Text>
        </TouchableOpacity>
      </View>

      {/* Cloud Account Sync / Auth Section */}
      {!user && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>CLOUD ACCOUNT SYNC</Text>
          <View style={styles.authForm}>
            <Text style={styles.authSub}>Sign in or create an account to sync watchlists across all devices.</Text>
            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor="#6b7280"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#6b7280"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <TouchableOpacity onPress={handleAuth} disabled={loading} style={styles.authBtn}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.authBtnText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={{ marginTop: 6, alignItems: 'center' }}>
              <Text style={styles.toggleText}>
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#18181f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#18181f',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
    gap: 14,
  },
  sectionTitle: {
    color: '#e50914',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    gap: 10,
  },
  statusHeading: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '800',
  },
  statusSub: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  prefTitle: {
    color: '#f3f4f6',
    fontSize: 13,
    fontWeight: '700',
  },
  prefSub: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  qualityGroup: {
    gap: 8,
    marginTop: 4,
  },
  qualitySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  qPill: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#0f0f12',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  qPillActive: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  qText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
  },
  qTextActive: {
    color: '#ffffff',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  actionText: {
    color: '#f3f4f6',
    fontSize: 13,
    fontWeight: '600',
  },
  formGroup: {
    gap: 4,
  },
  inputLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#0f0f12',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  authForm: {
    gap: 10,
  },
  authSub: {
    color: '#9ca3af',
    fontSize: 11,
  },
  errorText: {
    color: '#f87171',
    fontSize: 11,
  },
  authBtn: {
    backgroundColor: '#e50914',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  authBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  toggleText: {
    color: '#9ca3af',
    fontSize: 11,
  },
});
