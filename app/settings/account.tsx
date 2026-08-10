import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { safeStorage } from '../../lib/storageAdapter';

const AVATAR_CATEGORIES = [
  {
    name: 'Superhero & Action',
    avatars: [
      'https://api.dicebear.com/7.x/bottts/png?seed=Spider',
      'https://api.dicebear.com/7.x/bottts/png?seed=Batman',
      'https://api.dicebear.com/7.x/bottts/png?seed=Ironman',
      'https://api.dicebear.com/7.x/bottts/png?seed=Thor',
    ],
  },
  {
    name: 'Anime & Cartoons',
    avatars: [
      'https://api.dicebear.com/7.x/adventurer/png?seed=Goku',
      'https://api.dicebear.com/7.x/adventurer/png?seed=Naruto',
      'https://api.dicebear.com/7.x/adventurer/png?seed=Luffy',
      'https://api.dicebear.com/7.x/adventurer/png?seed=Eren',
    ],
  },
  {
    name: 'Sci-Fi & Villains',
    avatars: [
      'https://api.dicebear.com/7.x/bottts/png?seed=Vader',
      'https://api.dicebear.com/7.x/bottts/png?seed=Cyber',
      'https://api.dicebear.com/7.x/bottts/png?seed=Matrix',
      'https://api.dicebear.com/7.x/bottts/png?seed=Ghost',
    ],
  },
  {
    name: 'Classic Movie Icons',
    avatars: [
      'https://api.dicebear.com/7.x/avataaars/png?seed=Mafia',
      'https://api.dicebear.com/7.x/avataaars/png?seed=Detective',
      'https://api.dicebear.com/7.x/avataaars/png?seed=Ninja',
      'https://api.dicebear.com/7.x/avataaars/png?seed=Agent',
    ],
  },
];

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('AuraFlex User');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_CATEGORIES[0].avatars[0]);
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

      {/* Selected Avatar Preview Header */}
      <View style={styles.previewCard}>
        <View style={styles.avatarPreviewWrapper}>
          <Image source={{ uri: selectedAvatar }} style={styles.mainAvatar} resizeMode="contain" />
          <View style={styles.sparkleBadge}>
            <Ionicons name="sparkles" size={12} color="#ffffff" />
          </View>
        </View>
        <Text style={styles.previewName}>{name}</Text>
        <Text style={styles.previewSubtitle}>Choose a character avatar below</Text>
      </View>

      {/* Categorized Netflix-Style Avatar Picker */}
      <View style={styles.categoriesContainer}>
        {AVATAR_CATEGORIES.map((cat, catIdx) => (
          <View key={catIdx} style={styles.categoryCard}>
            <Text style={styles.categoryTitle}>{cat.name}</Text>
            <View style={styles.avatarGrid}>
              {cat.avatars.map((url, idx) => {
                const isSelected = selectedAvatar === url;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedAvatar(url)}
                    activeOpacity={0.8}
                    style={[styles.avatarOption, isSelected && styles.avatarSelected]}
                  >
                    <Image source={{ uri: url }} style={styles.avatarOptionImg} resizeMode="contain" />
                    {isSelected && (
                      <View style={styles.checkOverlay}>
                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      {/* Display Name & Status Section */}
      <View style={styles.sectionCard}>
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

        <View style={styles.statusBox}>
          <Ionicons name="shield-checkmark" size={16} color="#34d399" />
          <Text style={styles.statusText}>{user ? `Cloud Profile: ${user.email}` : 'Guest Profile Active'}</Text>
        </View>

        <TouchableOpacity onPress={handleSave} activeOpacity={0.8} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>{saved ? 'Saved Successfully!' : 'Save Account Settings'}</Text>
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
  previewCard: {
    backgroundColor: '#18181f',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  avatarPreviewWrapper: {
    position: 'relative',
  },
  mainAvatar: {
    width: 90,
    height: 90,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e50914',
    backgroundColor: '#0f0f12',
    padding: 4,
  },
  sparkleBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#e50914',
    padding: 5,
    borderRadius: 12,
  },
  previewName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },
  previewSubtitle: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  categoriesContainer: {
    gap: 14,
    marginBottom: 20,
  },
  categoryCard: {
    backgroundColor: 'rgba(24, 24, 31, 0.6)',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryTitle: {
    color: '#e50914',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  avatarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  avatarOption: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0f0f12',
    padding: 4,
    position: 'relative',
  },
  avatarSelected: {
    borderColor: '#e50914',
  },
  avatarOptionImg: {
    width: '100%',
    height: '100%',
  },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(229, 9, 20, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
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
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
    gap: 8,
  },
  statusText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
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
