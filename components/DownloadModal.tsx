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

  if (!visible) return null;

  const handleForceDownload = async (quality: string) => {
    setDownloading(true);
    const mediaType = media.media_type || 'movie';
    const targetUrl = mediaType === 'anime'
      ? `https://player.videasy.net/anime/${media.id}/1`
      : mediaType === 'tv'
      ? `https://player.videasy.net/tv/${media.id}/1/1`
      : `https://player.videasy.net/movie/${media.id}`;

    const fileName = `${media.title.replace(/[^a-zA-Z0-9]/g, '_')}_${quality}.mp4`;

    try {
      if (typeof window !== 'undefined' && window.fetch) {
        try {
          const response = await fetch(targetUrl, { mode: 'cors' });
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        } catch {
          // Fallback anchor attachment with target _self to prevent opening new tab
          const link = document.createElement('a');
          link.href = targetUrl;
          link.setAttribute('download', fileName);
          link.target = '_self';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        Linking.openURL(targetUrl).catch(() => {});
      }
    } catch (err) {
      console.warn('Download trigger exception:', err);
    } finally {
      setDownloading(false);
      onClose();
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
            ) : (
              <Ionicons name="download-outline" size={26} color="#e50914" />
            )}
          </View>

          <Text style={styles.modalTitle} numberOfLines={1}>
            {downloading ? 'Starting Download...' : `Download ${media.title}`}
          </Text>
          <Text style={styles.modalSubtitle}>
            {downloading ? 'Preparing video stream file...' : 'Select quality to save directly to disk'}
          </Text>

          <View style={styles.optionsGroup}>
            <TouchableOpacity
              onPress={() => handleForceDownload('1080p')}
              disabled={downloading}
              activeOpacity={0.8}
              style={[styles.optionItem, downloading && styles.optionDisabled]}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="sparkles" size={18} color="#e50914" />
                <View>
                  <Text style={styles.optionTitle}>1080p Ultra HD</Text>
                  <Text style={styles.optionSub}>Highest quality • Save to device</Text>
                </View>
              </View>
              <Ionicons name="download-outline" size={18} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleForceDownload('720p')}
              disabled={downloading}
              activeOpacity={0.8}
              style={[styles.optionItem, downloading && styles.optionDisabled]}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="film-outline" size={18} color="#d1d5db" />
                <View>
                  <Text style={styles.optionTitle}>720p Standard HD</Text>
                  <Text style={styles.optionSub}>Fast save • Mobile optimized</Text>
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
  optionDisabled: {
    opacity: 0.5,
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
