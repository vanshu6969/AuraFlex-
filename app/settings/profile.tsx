import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet, Alert } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeStorage } from '../../lib/storageAdapter';

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

export default function ProfilePage() {
  const [name, setName] = useState('AuraFlex User');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    safeStorage.getItem('auraflex_user_name').then((savedName) => {
      if (savedName) setName(savedName);
    });
    safeStorage.getItem('auraflex_user_avatar').then((savedAvatar) => {
      if (savedAvatar) setSelectedAvatar(savedAvatar);
    });
  }, []);

  const handleSave = async () => {
    await safeStorage.setItem('auraflex_user_name', name);
    await safeStorage.setItem('auraflex_user_avatar', selectedAvatar);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Settings</Text>
      </View>

      {/* Selected Avatar Display */}
      <View style={styles.avatarSection}>
        <Image source={{ uri: selectedAvatar }} style={styles.mainAvatar} />
        <Text style={styles.avatarLabel}>Choose Avatar</Text>

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
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={14} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Display Name Field */}
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

      {/* Save Changes Button */}
      <TouchableOpacity onPress={handleSave} activeOpacity={0.8} style={styles.saveBtn}>
        <Text style={styles.saveBtnText}>{saved ? 'Saved Successfully!' : 'Save Changes'}</Text>
      </TouchableOpacity>
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
    marginBottom: 24,
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  mainAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#e50914',
    marginBottom: 8,
  },
  avatarLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 240,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  avatarSelected: {
    borderColor: '#e50914',
  },
  avatarOptionImg: {
    width: '100%',
    height: '100%',
  },
  checkBadge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(229, 9, 20, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: {
    marginBottom: 24,
    gap: 6,
  },
  inputLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#18181f',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveBtn: {
    backgroundColor: '#e50914',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
