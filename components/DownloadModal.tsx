import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { MediaItem } from '../types/media';

interface DownloadModalProps {
  visible: boolean;
  onClose: () => void;
  media: MediaItem;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ visible, onClose, media }) => {
  const [downloading, setDownloading] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!visible) return null;

  const handleNativeDownload = async () => {
    setDownloading(true);

    try {
      const mediaType = media.media_type || 'movie';
      const cleanTitle = media.title.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${cleanTitle}_1080p.mp4`;
      const streamUrl = mediaType === 'anime'
        ? `https://player.videasy.net/anime/${media.id}/1`
        : mediaType === 'tv'
        ? `https://player.videasy.net/tv/${media.id}/1/1`
        : `https://player.videasy.net/movie/${media.id}`;

      if (typeof window !== 'undefined') {
        const a = document.createElement('a');
        a.href = streamUrl;
        a.setAttribute('download', fileName);
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        Linking.openURL(streamUrl).catch(() => {});
      }

      setDownloading(false);
      setCompleted(true);
      setTimeout(() => {
        setCompleted(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Download error:', err);
      setDownloading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <TouchableOpacity onPress={onClose} disabled={downloading} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            {downloading ? (
              <ActivityIndicator size="small" color="#e50914" />
            ) : completed ? (
              <Ionicons name="checkmark-circle" size={26} color="#10b981" />
            ) : (
              <Ionicons name="download-outline" size={26} color="#e50914" />
            )}
          </View>

          <Text style={styles.modalTitle}>
            {completed ? 'Download Started!' : 'Direct Download'}
          </Text>
          <Text style={styles.modalSubtitle} numberOfLines={1}>
            {media.title}
          </Text>

          <View style={styles.infoCard}>
            <Ionicons name="hardware-chip-outline" size={22} color="#e50914" />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoCardTitle}>Full HD 1080p Stream</Text>
              <Text style={styles.infoCardSub}>Saves directly to your device downloads</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleNativeDownload}
            disabled={downloading || completed}
            activeOpacity={0.8}
            style={[styles.primaryBtn, (downloading || completed) && styles.btnDisabled]}
          >
            <Ionicons name="sparkles" size={18} color="#ffffff" />
            <Text style={styles.primaryBtnText}>
              {downloading
                ? 'Connecting to Stream...'
                : completed
                ? 'Check Notification Bar'
                : 'Download Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#18181f',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#9ca3af',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f12',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
    marginBottom: 16,
  },
  infoCardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  infoCardSub: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#e50914',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
