import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

      {/* Preferences Navigation Shortcut */}
      <TouchableOpacity
        onPress={() => router.push('/settings/preferences' as any)}
        activeOpacity={0.7}
        style={styles.navCard}
      >
        <View style={styles.navRow}>
          <Ionicons name="options-outline" size={22} color="#e50914" />
          <View style={{ flex: 1 }}>
            <Text style={styles.navTitle}>App Preferences & Playback</Text>
            <Text style={styles.navSub}>Auto-play, hardware acceleration, streaming quality & data cache</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6b7280" />
        </View>
      </TouchableOpacity>

      {/* Cloud Account Sync / Auth Section */}
      {!user ? (
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
      ) : (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ACCOUNT DETAILS</Text>
          <Text style={styles.authSub}>You are currently logged in as <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>{user.email}</Text>.</Text>
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
  navCard: {
    backgroundColor: '#18181f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
    marginBottom: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  navSub: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
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
  authForm: {
    gap: 12,
  },
  authSub: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  formGroup: {
    gap: 6,
  },
  inputLabel: {
    color: '#d1d5db',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#0f0f12',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  authBtn: {
    backgroundColor: '#e50914',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  authBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  toggleText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
});
