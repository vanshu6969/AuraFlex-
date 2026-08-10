import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { safeStorage } from '../../lib/storageAdapter';

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('AuraFlex User');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [saved, setSaved] = useState(false);
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

    safeStorage.getItem('auraflex_user_name').then((savedName) => {
      if (savedName) setName(savedName);
    });
    safeStorage.getItem('auraflex_user_avatar').then((savedAvatar) => {
      if (savedAvatar) setSelectedAvatar(savedAvatar);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSave = async () => {
    await safeStorage.setItem('auraflex_user_name', name);
    await safeStorage.setItem('auraflex_user_avatar', selectedAvatar);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
      </View>

      {/* Profile & Avatar Customization */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>AVATAR & PROFILE</Text>
        <View style={styles.avatarSection}>
          <Image source={{ uri: selectedAvatar }} style={styles.mainAvatar} />
          <View style={styles.avatarGrid}>
            {AVATARS.map((url, idx) => {
              const isSelected = selectedAvatar === url;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedAvatar(url)}
                  activeOpacity={0.8}
                  style={[styles.avatarOption, isSelected && styles.avatarSelected]}
                >
                  <Image source={{ uri: url }} style={styles.avatarOptionImg} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>DISPLAY NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter display name"
            placeholderTextColor="#6b7280"
            style={styles.input}
          />
        </View>

        <TouchableOpacity onPress={handleSave} activeOpacity={0.8} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>{saved ? 'Saved Successfully!' : 'Save Profile Changes'}</Text>
        </TouchableOpacity>
      </View>

      {/* Cloud Account Sync / Auth Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>CLOUD ACCOUNT SYNC</Text>
        {user ? (
          <View style={styles.userBox}>
            <Ionicons name="cloud-done-outline" size={24} color="#10b981" />
            <View style={{ flex: 1 }}>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userSub}>Watchlist and history sync active across all devices.</Text>
            </View>
          </View>
        ) : (
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

            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={{ marginTop: 8, alignItems: 'center' }}>
              <Text style={styles.toggleText}>
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
    gap: 12,
    marginBottom: 20,
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
    gap: 12,
  },
  sectionTitle: {
    color: '#e50914',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 8,
    gap: 12,
  },
  mainAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#e50914',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  avatarOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: '#e50914',
  },
  avatarOptionImg: {
    width: '100%',
    height: '100%',
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
  saveBtn: {
    backgroundColor: '#e50914',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  userBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f12',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  userEmail: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  userSub: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
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
