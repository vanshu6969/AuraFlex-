import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Linking } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { MediaItem } from '../types/media';

interface DownloadModalProps {
  visible: boolean;
  onClose: () => void;
  media: MediaItem;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ visible, onClose, media }) => {
  if (!visible) return null;

  const startNativeDownload = (quality: string) => {
    const mediaType = media.media_type || 'movie';
    const downloadUrl = mediaType === 'anime'
      ? `https://player.videasy.net/anime/${media.id}/1`
      : mediaType === 'tv'
      ? `https://player.videasy.net/tv/${media.id}/1/1`
      : `https://player.videasy.net/movie/${media.id}`;

    if (typeof window !== 'undefined') {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      Linking.openURL(downloadUrl).catch(() => {});
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Ionicons name="download-outline" size={26} color="#e50914" />
          </View>

          <Text style={styles.modalTitle} numberOfLines={1}>
            Download {media.title}
          </Text>
          <Text style={styles.modalSubtitle}>Select stream quality to save to your device</Text>

          <View style={styles.optionsGroup}>
            <TouchableOpacity
              onPress={() => startNativeDownload('1080p')}
              activeOpacity={0.8}
              style={styles.optionItem}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="sparkles" size={18} color="#e50914" />
                <View>
                  <Text style={styles.optionTitle}>1080p Ultra HD</Text>
                  <Text style={styles.optionSub}>Highest quality • Fast Server</Text>
                </View>
              </View>
              <Ionicons name="download-outline" size={18} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => startNativeDownload('720p')}
              activeOpacity={0.8}
              style={styles.optionItem}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="film-outline" size={18} color="#d1d5db" />
                <View>
                  <Text style={styles.optionTitle}>720p Standard HD</Text>
                  <Text style={styles.optionSub}>Fast download • Mobile optimized</Text>
                </View>
              </View>
              <Ionicons name="download-outline" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
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
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#9ca3af',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
  },
  optionsGroup: {
    width: '100%',
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f0f12',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionTitle: {
    color: '#f3f4f6',
    fontSize: 13,
    fontWeight: '700',
  },
  optionSub: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 2,
  },
});
