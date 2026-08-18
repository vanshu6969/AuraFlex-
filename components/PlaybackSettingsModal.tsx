import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeStorage } from '../lib/storageAdapter';

interface PlaybackSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlaybackSettingsModal: React.FC<PlaybackSettingsModalProps> = ({ isOpen, onClose }) => {
  const [resolution, setResolution] = useState<'4K Ultra HD' | '1080p FHD' | '720p HD' | 'Auto (Adaptive)'>('1080p FHD');
  const [bufferMode, setBufferMode] = useState<'Aggressive Preload' | 'Standard' | 'Data Saver'>('Aggressive Preload');
  const [autoSkipIntro, setAutoSkipIntro] = useState(true);
  const [autoPlayNext, setAutoPlayNext] = useState(true);

  useEffect(() => {
    if (isOpen) {
      safeStorage.getItem('@auraflex_playback_prefs').then((raw) => {
        if (raw) {
          try {
            const prefs = JSON.parse(raw);
            if (prefs.resolution) setResolution(prefs.resolution);
            if (prefs.bufferMode) setBufferMode(prefs.bufferMode);
            if (typeof prefs.autoSkipIntro === 'boolean') setAutoSkipIntro(prefs.autoSkipIntro);
            if (typeof prefs.autoPlayNext === 'boolean') setAutoPlayNext(prefs.autoPlayNext);
          } catch {}
        }
      });
    }
  }, [isOpen]);

  const handleSave = async () => {
    const prefs = { resolution, bufferMode, autoSkipIntro, autoPlayNext };
    await safeStorage.setItem('@auraflex_playback_prefs', JSON.stringify(prefs));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Ambient Red Top Glow */}
          <View style={styles.ambientGlow} />

          {/* Icon Pod */}
          <View style={styles.iconPod}>
            <Ionicons name="options-outline" size={26} color="#e50914" />
          </View>

          {/* Header Title */}
          <Text style={styles.titleText}>Playback & Player Engine</Text>
          <Text style={styles.subtitleText}>Customize resolution, buffering, and playback behavior</Text>

          {/* Section 1: Preferred Resolution */}
          <View style={styles.settingGroup}>
            <Text style={styles.groupLabel}>PREFERRED RESOLUTION</Text>
            <View style={styles.chipRow}>
              {(['4K Ultra HD', '1080p FHD', '720p HD', 'Auto (Adaptive)'] as const).map((res) => {
                const isSelected = resolution === res;
                return (
                  <TouchableOpacity
                    key={res}
                    activeOpacity={0.8}
                    onPress={() => setResolution(res)}
                    style={[styles.chipBtn, isSelected && styles.chipBtnSelected]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{res}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 2: CDN Buffer Mode */}
          <View style={styles.settingGroup}>
            <Text style={styles.groupLabel}>CDN BUFFER MODE</Text>
            <View style={styles.chipRow}>
              {(['Aggressive Preload', 'Standard', 'Data Saver'] as const).map((mode) => {
                const isSelected = bufferMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    activeOpacity={0.8}
                    onPress={() => setBufferMode(mode)}
                    style={[styles.chipBtn, isSelected && styles.chipBtnSelected]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{mode}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 3: Interactive Toggles */}
          <View style={styles.togglesCard}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextGroup}>
                <Text style={styles.toggleTitle}>Auto-Skip TV Intros</Text>
                <Text style={styles.toggleSub}>Automatically skip openings for TV episodes</Text>
              </View>
              <Switch
                value={autoSkipIntro}
                onValueChange={setAutoSkipIntro}
                trackColor={{ false: '#374151', true: '#e50914' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextGroup}>
                <Text style={styles.toggleTitle}>Auto-Play Next Episode</Text>
                <Text style={styles.toggleSub}>Start next episode seamlessly when current ends</Text>
              </View>
              <Switch
                value={autoPlayNext}
                onValueChange={setAutoPlayNext}
                trackColor={{ false: '#374151', true: '#e50914' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* Save Preferences Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSave}
            style={styles.saveBtn}
          >
            <Text style={styles.saveBtnText}>Save Preferences</Text>
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
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        } as any)
      : {}),
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
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
    width: 160,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(229, 9, 20, 0.18)',
    ...(Platform.OS === 'web'
      ? ({
          filter: 'blur(24px)',
        } as any)
      : {}),
  },
  iconPod: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitleText: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  settingGroup: {
    width: '100%',
    marginBottom: 14,
  },
  groupLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipBtnSelected: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  chipText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  togglesCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    marginTop: 4,
    marginBottom: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  toggleTextGroup: {
    flex: 1,
    marginRight: 10,
  },
  toggleTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  toggleSub: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 10,
  },
  saveBtn: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
