import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function AboutPage() {
  const handleOpenDiscord = () => {
    if (typeof window !== 'undefined') {
      window.open('https://discord.com', '_blank');
    } else {
      Linking.openURL('https://discord.com');
    }
  };

  const handleOpenTelegram = () => {
    const tgUrl = process.env.NEXT_PUBLIC_TELEGRAM_LINK || 'https://t.me/AuraFlexmovies';
    if (typeof window !== 'undefined') {
      window.open(tgUrl, '_blank');
    } else {
      Linking.openURL(tgUrl);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.cardContainer}>
        {/* Ambient Red Glow */}
        <View style={styles.ambientGlow} />

        {/* Header Back Row */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        {/* 1. App Icon Pod */}
        <View style={styles.iconPod}>
          <Ionicons name="film-outline" size={32} color="#e50914" />
        </View>

        {/* 2. Title & Version Badge */}
        <View style={styles.titleGroup}>
          <Text style={styles.titleText}>
            Aura<Text style={styles.redText}>Flex Movies</Text>
          </Text>
          <View style={styles.versionBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.versionText}>Official Web & App Release</Text>
          </View>
        </View>

        {/* 3. Description */}
        <Text style={styles.description}>
          AuraFlex Movies is your official high-performance cinema hub to stream and download full Bollywood, Hollywood, Punjabi, South Indian, and regional movies in 1080p Full HD with zero popup ads.
        </Text>

        {/* 4. Visually Prominent Telegram Channel Community Card */}
        <View style={styles.telegramCard}>
          <View style={styles.telegramHeaderRow}>
            <View style={styles.telegramIconCircle}>
              <Ionicons name="paper-plane" size={24} color="#0088cc" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.telegramCardTitle}>Join Our Official Telegram Community</Text>
              <Text style={styles.telegramCardHandle}>@AuraFlexmovies</Text>
            </View>
          </View>

          <View style={styles.benefitsList}>
            <View style={styles.benefitRow}>
              <Text style={styles.benefitEmoji}>⚡</Text>
              <Text style={styles.benefitText}>Instant notifications when new 1080p HD prints drop</Text>
            </View>

            <View style={styles.benefitRow}>
              <Text style={styles.benefitEmoji}>🎬</Text>
              <Text style={styles.benefitText}>Direct request portal for missing movies & series</Text>
            </View>

            <View style={styles.benefitRow}>
              <Text style={styles.benefitEmoji}>📥</Text>
              <Text style={styles.benefitText}>Fast direct download links & mirror servers</Text>
            </View>

            <View style={styles.benefitRow}>
              <Text style={styles.benefitEmoji}>🚫</Text>
              <Text style={styles.benefitText}>100% ad-free & zero spam community</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenTelegram}
            style={styles.telegramCtaBtn}
          >
            <Ionicons name="paper-plane" size={18} color="#ffffff" />
            <Text style={styles.telegramCtaText}>Join @AuraFlexmovies on Telegram</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Credits Card */}
        <View style={styles.creditsSubCard}>
          <View style={styles.creditRow}>
            <Text style={styles.creditLabel}>Developed By</Text>
            <Text style={styles.creditValue}>Tajinder</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.creditRow}>
            <Text style={styles.creditLabel}>Community Discord</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenDiscord}
              style={styles.discordChip}
            >
              <Ionicons name="logo-discord" size={14} color="#818cf8" />
              <Text style={styles.discordChipText}>princev3</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c0f',
  },
  contentContainer: {
    paddingVertical: 30,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#12141c',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
  },
  ambientGlow: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    width: 240,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(229, 9, 20, 0.25)',
  },
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  iconPod: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titleGroup: {
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  redText: {
    color: '#e50914',
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ef4444',
  },
  versionText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 20,
  },
  telegramCard: {
    width: '100%',
    backgroundColor: 'rgba(0, 136, 204, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.45)',
    padding: 18,
    marginTop: 22,
    gap: 14,
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  telegramHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  telegramIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 136, 204, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 136, 204, 0.4)',
  },
  telegramCardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  telegramCardHandle: {
    color: '#0088cc',
    fontSize: 12,
    fontWeight: '700',
  },
  benefitsList: {
    gap: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitEmoji: {
    fontSize: 14,
  },
  benefitText: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    lineHeight: 17,
  },
  telegramCtaBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0088cc',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
    shadowColor: '#0088cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  telegramCtaText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  creditsSubCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    marginTop: 20,
    gap: 12,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creditLabel: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '500',
  },
  creditValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  discordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discordChipText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
