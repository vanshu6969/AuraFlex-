import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Linking } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

// Installed version in app code (set to '1.0.0' for release builds)
const CURRENT_VERSION = '1.0.0';

// Clean public raw URL for version.json
const PRIMARY_VERSION_URL = 'https://raw.githubusercontent.com/vanshu6969/AuraFlex-/main/version.json';
const FALLBACK_VERSION_URL = 'https://raw.githubusercontent.com/vanshu6969/VEGA-APP/main/version.json';

interface UpdateData {
  version: string;
  size: string;
  changelog: string;
  downloadUrl: string;
  forceUpdate?: boolean;
}

export const UpdateModal = () => {
  const [updateData, setUpdateData] = useState<UpdateData | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        let response = await fetch(PRIMARY_VERSION_URL, { cache: 'no-store' });
        if (!response.ok) {
          response = await fetch(FALLBACK_VERSION_URL, { cache: 'no-store' });
        }
        if (!response.ok) return;

        const data: UpdateData = await response.json();

        // Trigger update modal if online version differs from installed code version
        if (data.version && data.version !== CURRENT_VERSION) {
          setUpdateData(data);
          setShowModal(true);
        }
      } catch (err) {
        console.log('Update check skipped or device is offline:', err);
      }
    };

    checkVersion();
  }, []);

  if (!showModal || !updateData) return null;

  const handleUpdateClick = () => {
    if (typeof window !== 'undefined') {
      const isNative = typeof (window as any).Capacitor?.isNativePlatform === 'function' 
        ? (window as any).Capacitor.isNativePlatform() 
        : false;
        
      if (isNative) {
        window.open(updateData.downloadUrl, '_system');
      } else {
        window.open(updateData.downloadUrl, '_blank');
      }
    } else {
      Linking.openURL(updateData.downloadUrl).catch(() => {});
    }
  };

  return (
    <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {!updateData.forceUpdate && (
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}

          <View style={styles.iconCircle}>
            <Ionicons name="refresh-circle" size={32} color="#e50914" />
          </View>

          <Text style={styles.modalTitle}>New Update Available!</Text>
          <Text style={styles.modalSubtitle}>
            AuraFlex v{updateData.version} <Text style={styles.sizeText}>({updateData.size})</Text>
          </Text>

          <View style={styles.changelogBox}>
            <View style={styles.changelogHeader}>
              <Ionicons name="sparkles" size={14} color="#e50914" />
              <Text style={styles.changelogTitle}>WHAT'S NEW</Text>
            </View>
            <Text style={styles.changelogText}>{updateData.changelog}</Text>
          </View>

          <View style={styles.btnRow}>
            {!updateData.forceUpdate && (
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                activeOpacity={0.8}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleUpdateClick}
              activeOpacity={0.8}
              style={styles.updateBtn}
            >
              <Ionicons name="download" size={16} color="#ffffff" />
              <Text style={styles.updateBtnText}>Update Now</Text>
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  sizeText: {
    color: '#e50914',
    fontWeight: '700',
  },
  changelogBox: {
    width: '100%',
    backgroundColor: '#0f0f12',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 18,
    gap: 6,
  },
  changelogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changelogTitle: {
    color: '#e50914',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  changelogText: {
    color: '#d1d5db',
    fontSize: 11,
    lineHeight: 16,
  },
  btnRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#27272a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#d1d5db',
    fontSize: 13,
    fontWeight: '600',
  },
  updateBtn: {
    flex: 1,
    backgroundColor: '#e50914',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  updateBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
