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

  const handleOpenDownloader = (quality = '1080p') => {
    const mediaType = media.media_type || 'movie';
    const targetUrl = `https://dl.vidsrc.vip/${mediaType}/${media.id}`;

    if (typeof window !== 'undefined') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(targetUrl).catch(() => {});
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
          <Text style={styles.modalSubtitle}>Select download method for your device</Text>

          <View style={styles.optionsGroup}>
            {/* Option 1: Fast Stream Downloader */}
            <TouchableOpacity
              onPress={() => handleOpenDownloader('1080p')}
              activeOpacity={0.8}
              style={styles.primaryBtn}
            >
              <View style={styles.btnLeft}>
                <Ionicons name="download" size={20} color="#ffffff" />
                <View>
                  <Text style={styles.primaryBtnTitle}>Generate Download Link</Text>
                  <Text style={styles.primaryBtnSub}>1080p / 720p Direct MP4 Stream</Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={16} color="#ffffff" />
            </TouchableOpacity>

            {/* Option 2: Mobile / App Tips */}
            <View style={styles.tipBox}>
              <View style={styles.tipHeader}>
                <Ionicons name="phone-portrait-outline" size={16} color="#e50914" />
                <Text style={styles.tipHeaderTitle}>Android App Users</Text>
              </View>
              <Text style={styles.tipText}>
                Install <Text style={styles.boldText}>1DM</Text> or <Text style={styles.boldText}>IDM</Text> from Google Play Store to catch full HD video downloads automatically while playing in AuraFlex!
              </Text>
            </View>
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
    maxWidth: 360,
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
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#e50914',
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryBtnTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryBtnSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  tipBox: {
    backgroundColor: '#0f0f12',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipHeaderTitle: {
    color: '#f3f4f6',
    fontSize: 12,
    fontWeight: '700',
  },
  tipText: {
    color: '#9ca3af',
    fontSize: 11,
    lineHeight: 16,
  },
  boldText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
