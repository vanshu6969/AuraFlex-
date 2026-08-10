import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { safeStorage } from '../lib/storageAdapter';

export const DisclaimerModal = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    safeStorage.getItem('auraflex_disclaimer_accepted').then((accepted) => {
      if (!accepted || accepted !== 'true') {
        setVisible(true);
      }
    });
  }, []);

  const handleAgree = async () => {
    await safeStorage.setItem('auraflex_disclaimer_accepted', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={28} color="#e50914" />
          </View>

          <Text style={styles.modalTitle}>Disclaimer & Terms</Text>

          <ScrollView style={styles.scrollBox} showsVerticalScrollIndicator={false}>
            <Text style={styles.disclaimerText}>
              Welcome to <Text style={styles.boldText}>AuraFlex</Text>. By using this application, you agree to the following terms:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• AuraFlex does not host or store any media content on its servers.</Text>
              <Text style={styles.bulletItem}>• All stream sources and content metadata are provided by public third-party APIs.</Text>
              <Text style={styles.bulletItem}>• This app is designed for educational and personal testing purposes only.</Text>
            </View>
          </ScrollView>

          <TouchableOpacity onPress={handleAgree} activeOpacity={0.8} style={styles.agreeBtn}>
            <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
            <Text style={styles.agreeBtnText}>I Agree & Continue</Text>
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
    maxWidth: 360,
    backgroundColor: '#18181f',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    alignItems: 'center',
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
    marginBottom: 12,
  },
  scrollBox: {
    maxHeight: 180,
    backgroundColor: '#0f0f12',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 18,
    width: '100%',
  },
  disclaimerText: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  boldText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  bulletList: {
    gap: 6,
  },
  bulletItem: {
    color: '#9ca3af',
    fontSize: 11,
    lineHeight: 16,
  },
  agreeBtn: {
    width: '100%',
    backgroundColor: '#e50914',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  agreeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
