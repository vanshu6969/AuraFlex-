import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeStorage } from '../../lib/storageAdapter';

const NETFLIX_AVATARS = [
  {
    name: 'Popular Characters',
    avatars: [
      'https://occ-0-2773-2774.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABXvS69-Xk4NUp8V6K0x-B462R2yJtC5M1qgE9w5M0r0A2b2w7cR8L4A1c3dE5f6g7h8i9j0k.png',
      'https://occ-0-2773-2774.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABY5cA-M8kS2G3mJ3R34M8v8k8_J8q8u8v8w8x8y8z8A8B8C8D8E8F8G8H8I8J.png',
      'https://occ-0-2773-2774.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABe8fN3J3K3L3M3N3O3P3Q3R3S3T3U3V3W3X3Y3Z3a3b3c3d3e3f3g.png',
      'https://occ-0-2773-2774.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABf9gO4K4L4M4N4O4P4Q4R4S4T4U4V4W4X4Y4Z4a4b4c4d4e4f4g4h.png',
    ],
  },
  {
    name: 'Netflix Classics',
    avatars: [
      'https://occ-0-2773-2774.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABTZ5N5O5P5Q5R5S5T5U5V5W5X5Y5Z5a5b5c5d5e5f5g5h5i5j5k.png',
      'https://occ-0-2773-2774.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABU0aP6Q6R6S6T6U6V6W6X6Y6Z6a6b6c6d6e6f6g6h6i6j6k6l.png',
      'https://occ-0-2773-2774.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABV1bQ7R7S7T7U7V7W7X7Y7Z7a7b7c7d7e7f7g7h7i7j7k7l7m.png',
      'https://occ-0-2773-2774.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABW2cR8S8T8U8V8W8X8Y8Z8a8b8c8d8e8f8g8h8i8j8k8l8m8n.png',
    ],
  },
  {
    name: 'Anime & Superheroes',
    avatars: [
      'https://api.dicebear.com/7.x/bottts/png?seed=Spider',
      'https://api.dicebear.com/7.x/bottts/png?seed=Batman',
      'https://api.dicebear.com/7.x/adventurer/png?seed=Goku',
      'https://api.dicebear.com/7.x/adventurer/png?seed=Naruto',
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
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
        <Text style={styles.previewSubtitle}>Choose your Netflix character avatar</Text>
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
