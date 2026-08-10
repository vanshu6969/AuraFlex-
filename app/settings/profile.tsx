import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeStorage } from '../../lib/storageAdapter';

const NETFLIX_AVATARS = [
  {
    name: 'Popular Characters',
    avatars: [
      'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png',
      'https://mir-s3-cdn-cf.behance.net/project_modules/disp/84c20033850498.56ba69ac290ea.png',
      'https://mir-s3-cdn-cf.behance.net/project_modules/disp/1bd18a33850498.56ba69ac2ba5b.png',
      'https://mir-s3-cdn-cf.behance.net/project_modules/disp/bf65a833850498.56ba69ac0e2a9.png',
    ],
  },
  {
    name: 'Netflix Classics',
    avatars: [
      'https://mir-s3-cdn-cf.behance.net/project_modules/disp/366be133850498.56ba69ac36858.png',
      'https://mir-s3-cdn-cf.behance.net/project_modules/disp/bb155133850498.56ba69ac33f32.png',
      'https://mir-s3-cdn-cf.behance.net/project_modules/disp/2b561033850498.56ba69ac31937.png',
      'https://mir-s3-cdn-cf.behance.net/project_modules/disp/c7906d33850498.56ba69ac352a9.png',
    ],
  },
  {
    name: 'Anime & Superheroes',
    avatars: [
      'https://api.dicebear.com/7.x/bottts/png?seed=SpiderMan',
      'https://api.dicebear.com/7.x/adventurer/png?seed=Goku',
      'https://api.dicebear.com/7.x/adventurer/png?seed=Luffy',
      'https://api.dicebear.com/7.x/bottts/png?seed=Batman',
    ],
  },
];

export default function ProfileSettingsPage() {
  const [name, setName] = useState('AuraFlex User');
  const [selectedAvatar, setSelectedAvatar] = useState(NETFLIX_AVATARS[0].avatars[0]);
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
        <Text style={styles.headerTitle}>Profile Settings</Text>
      </View>

      {/* Selected Avatar Preview Header */}
      <View style={styles.previewCard}>
        <View style={styles.avatarPreviewWrapper}>
          <Image source={{ uri: selectedAvatar }} style={styles.mainAvatar} resizeMode="cover" />
          <View style={styles.sparkleBadge}>
            <Ionicons name="sparkles" size={12} color="#ffffff" />
          </View>
        </View>
        <Text style={styles.previewName}>{name}</Text>
        <Text style={styles.previewSubtitle}>Choose your character avatar</Text>
      </View>

      {/* Categorized Netflix Avatar Gallery */}
      <View style={styles.categoriesContainer}>
        {NETFLIX_AVATARS.map((cat, catIdx) => (
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
                    <Image source={{ uri: url }} style={styles.avatarOptionImg} resizeMode="cover" />
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

      {/* Display Name Input */}
      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>DISPLAY NAME</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter display name"
          placeholderTextColor="#6b7280"
          style={styles.input}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity onPress={handleSave} activeOpacity={0.8} style={styles.saveBtn}>
        <Text style={styles.saveBtnText}>{saved ? 'Saved Profile!' : 'Save Profile Changes'}</Text>
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
  inputCard: {
    backgroundColor: '#18181f',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
    marginBottom: 20,
  },
  inputLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#0f0f12',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
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
