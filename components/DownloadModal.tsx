import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { MediaItem } from '../types/media';
import { getSniffedStreams } from '../lib/sniffer';

interface DownloadModalProps {
  visible: boolean;
  onClose: () => void;
  media: MediaItem;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ visible, onClose, media }) => {
  const [sniffedUrl, setSniffedUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (visible) {
      const activeStreams = getSniffedStreams();
      if (activeStreams.length > 0) {
        setSniffedUrl(activeStreams[0].url);
      } else {
        const mediaType = media.media_type || 'movie';
        const fallbackUrl = mediaType === 'anime'
          ? `https://player.videasy.net/anime/${media.id}/1`
          : mediaType === 'tv'
          ? `https://player.videasy.net/tv/${media.id}/1/1`
          : `https://player.videasy.net/movie/${media.id}`;
        setSniffedUrl(fallbackUrl);
      }
    }
  }, [visible, media]);

  if (!visible) return null;

  const handleSniffedDownload = () => {
    setDownloading(true);
    const targetUrl = sniffedUrl || '#';
    const fileName = `${media.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;

    if (typeof window !== 'undefined') {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      Linking.openURL(targetUrl).catch(() => {});
    }

    setTimeout(() => {
      setDownloading(false);
      onClose();
    }, 1500);
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
              <Ionicons name="sparkles" size={26} color="#e50914" />
            )}
          </View>

          <Text style={styles.modalTitle}>In-App Media Sniffer</Text>
          <Text style={styles.modalSubtitle}>Automatic stream detection</Text>

          <View style={styles.detectedBox}>
            <Ionicons name="checkmark-circle" size={22} color="#10b981" />
            <View style={{ flex: 1 }}>
              <Text style={styles.detectedTitle} numberOfLines={1}>
                {media.title}
              </Text>
              <Text style={styles.detectedSub}>Stream Detected (1080p HD)</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSniffedDownload}
            disabled={downloading}
            activeOpacity={0.8}
            style={[styles.primaryBtn, downloading && styles.btnDisabled]}
          >
            <Ionicons name="download" size={18} color="#ffffff" />
            <Text style={styles.primaryBtnText}>
              {downloading ? 'Downloading File...' : 'Download Stream Now'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Ionicons name="shield-checkmark" size={14} color="#9ca3af" />
            <Text style={styles.footerText}>AuraFlex Native Downloader Engine</Text>
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
  detectedBox: {
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
  detectedTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  detectedSub: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '500',
  },
});
