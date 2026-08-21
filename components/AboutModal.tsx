import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Ambient Red Glow */}
          <View style={styles.ambientGlow} />

          {/* 1. App Icon Pod */}
          <View style={styles.iconPod}>
            <Ionicons name="film-outline" size={28} color="#e50914" />
          </View>

          {/* 2. Title & Version Badge */}
          <View style={styles.titleGroup}>
            <Text style={styles.titleText}>
              Aura<Text style={styles.redText}>Flex</Text>
            </Text>
            <View style={styles.versionBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.versionText}>v1.0.0 (Native Build)</Text>
            </View>
          </View>

          {/* 3. Description */}
          <Text style={styles.description}>
            A modern high-performance streaming hub bringing you Movies, TV Shows, Asian Dramas, Punjabi Cinema, and Anime with multi-server playback.
          </Text>

          {/* 4. High-Converting Telegram Channel Community Card */}
          <View style={styles.telegramCard}>
            <View style={styles.telegramHeaderRow}>
              <View style={styles.telegramIconCircle}>
                <Ionicons name="paper-plane" size={20} color="#0088cc" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.telegramCardTitle}>Official Telegram Channel</Text>
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
              <Ionicons name="paper-plane" size={15} color="#ffffff" />
              <Text style={styles.telegramCtaText}>Join @AuraFlexmovies on Telegram</Text>
            </TouchableOpacity>
          </View>

          {/* 5. Creator & Discord Credits Sub-Card */}
          <View style={styles.creditsSubCard}>
            <View style={styles.creditRow}>
              <Text style={styles.creditLabel}>Developed By</Text>
              <Text style={styles.creditValue}>Tajinder</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.creditRow}>
              <Text style={styles.creditLabel}>Discord</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleOpenDiscord}
                style={styles.discordChip}
              >
                <Ionicons name="logo-discord" size={12} color="#818cf8" />
                <Text style={styles.discordChipText}>princev3</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 6. Close Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={styles.doneBtn}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        } as any)
      : {}),
  },
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#12141a',
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
    top: -30,
    alignSelf: 'center',
    width: 140,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    ...(Platform.OS === 'web'
      ? ({
          filter: 'blur(24px)',
        } as any)
      : {}),
  },
  iconPod: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  titleGroup: {
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
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
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  versionText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  creditsSubCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    marginTop: 18,
    gap: 10,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creditLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  creditValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  discordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discordChipText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  telegramCard: {
    width: '100%',
    backgroundColor: 'rgba(0, 136, 204, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.4)',
    padding: 14,
    marginTop: 16,
    gap: 10,
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  telegramHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  telegramIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 136, 204, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 136, 204, 0.4)',
  },
  telegramCardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  telegramCardHandle: {
    color: '#0088cc',
    fontSize: 11,
    fontWeight: '700',
  },
  benefitsList: {
    gap: 6,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitEmoji: {
    fontSize: 12,
  },
  benefitText: {
    color: '#d1d5db',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
    lineHeight: 15,
  },
  telegramCtaBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0088cc',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  telegramCtaText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  doneBtn: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
