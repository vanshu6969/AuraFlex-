import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { streamOverrideService, StreamOverrideRecord } from '../../lib/streamOverrides';
import { tmdbService } from '../../lib/tmdb';
import { showToast } from '../../lib/toast';

export default function AdminStreamOverridesScreen() {
  const [tmdbId, setTmdbId] = useState('');
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<'movie' | 'tv' | 'anime'>('movie');
  const [customUrl, setCustomUrl] = useState('');
  const [backupUrl, setBackupUrl] = useState('');
  
  const [lookupLoading, setLookupLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [overrides, setOverrides] = useState<StreamOverrideRecord[]>([]);
  const [loadingOverrides, setLoadingOverrides] = useState(true);

  // Load existing stream overrides on mount
  useEffect(() => {
    fetchOverrides();
  }, []);

  const fetchOverrides = async () => {
    setLoadingOverrides(true);
    const data = await streamOverrideService.getAllOverrides();
    setOverrides(data);
    setLoadingOverrides(false);
  };

  // Lookup TMDB Details by ID
  const handleLookupTMDB = async () => {
    if (!tmdbId.trim()) {
      showToast('Enter a TMDB ID to lookup', 'info');
      return;
    }
    setLookupLoading(true);
    try {
      const details = await tmdbService.getMediaDetails(tmdbId.trim(), mediaType);
      if (details && details.title) {
        setTitle(details.title);
        showToast(`Found: ${details.title}`, 'success');
      } else {
        showToast('No title found for TMDB ID', 'error');
      }

    } catch {
      showToast('Lookup failed', 'error');
    } finally {
      setLookupLoading(false);
    }
  };

  // Save or Update Override
  const handleSave = async () => {
    if (!tmdbId.trim() || !title.trim() || !customUrl.trim()) {
      showToast('Please fill TMDB ID, Title, and Custom Stream URL', 'error');
      return;
    }

    setSaving(true);
    const success = await streamOverrideService.upsertOverride({
      tmdb_id: tmdbId.trim(),
      title: title.trim(),
      media_type: mediaType,
      custom_stream_url: customUrl.trim(),
      backup_stream_url: backupUrl.trim() || null,
    });
    setSaving(false);

    if (success) {
      showToast('Stream Override Saved Successfully!', 'success');
      setTmdbId('');
      setTitle('');
      setCustomUrl('');
      setBackupUrl('');
      fetchOverrides();
    } else {
      showToast('Failed to save stream override', 'error');
    }
  };

  // Populate Form for Editing
  const handleEdit = (record: StreamOverrideRecord) => {
    setTmdbId(record.tmdb_id);
    setTitle(record.title);
    setMediaType(record.media_type);
    setCustomUrl(record.custom_stream_url);
    setBackupUrl(record.backup_stream_url || '');
    showToast(`Loaded ${record.title} for editing`, 'info');
  };

  // Delete Override
  const handleDelete = async (tmdb_id: string, itemTitle: string) => {
    const success = await streamOverrideService.deleteOverride(tmdb_id);
    if (success) {
      showToast(`Deleted override for ${itemTitle}`, 'info');
      fetchOverrides();
    } else {
      showToast('Failed to delete override', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Centralized Stream Manager</Text>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>

        {/* --- Form Section --- */}
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Add / Replace Stream URL Override</Text>
          <Text style={styles.formSubtitle}>
            Custom stream links configured here immediately take precedence as VIP Server #1 across all user devices.
          </Text>

          {/* TMDB ID & Lookup Row */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>TMDB ID *</Text>
            <View style={styles.rowInput}>
              <TextInput
                value={tmdbId}
                onChangeText={setTmdbId}
                placeholder="e.g. 550 (Fight Club) or 1396 (Breaking Bad)"
                placeholderTextColor="#6b7280"
                style={[styles.textInput, { flex: 1 }]}
                keyboardType="numeric"
              />
              <TouchableOpacity
                onPress={handleLookupTMDB}
                disabled={lookupLoading}
                style={styles.lookupBtn}
              >
                {lookupLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="search" size={16} color="#ffffff" />
                    <Text style={styles.lookupBtnText}>Lookup</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title Name *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Shera (2024)"
              placeholderTextColor="#6b7280"
              style={styles.textInput}
            />
          </View>

          {/* Media Type Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Media Type</Text>
            <View style={styles.typeSelectorRow}>
              {(['movie', 'tv', 'anime'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setMediaType(type)}
                  style={[styles.typePill, mediaType === type && styles.typePillActive]}
                >
                  <Text style={[styles.typePillText, mediaType === type && styles.typePillTextActive]}>
                    {type.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Primary Stream URL */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Custom Primary Stream URL (VIP Server #1) *</Text>
            <TextInput
              value={customUrl}
              onChangeText={setCustomUrl}
              placeholder="https://embed.provider.com/movie/550 or HLS stream link"
              placeholderTextColor="#6b7280"
              style={styles.textInput}
              autoCapitalize="none"
            />
          </View>

          {/* Backup Stream URL */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Backup Stream URL (Optional)</Text>
            <TextInput
              value={backupUrl}
              onChangeText={setBackupUrl}
              placeholder="https://backup.provider.com/movie/550"
              placeholderTextColor="#6b7280"
              style={styles.textInput}
              autoCapitalize="none"
            />
          </View>

          {/* Submit Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={styles.saveBtn}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color="#ffffff" />
                <Text style={styles.saveBtnText}>Save Stream Override</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* --- Active Overrides List Section --- */}
        <View style={styles.listCard}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.formSectionTitle}>Active Database Overrides</Text>
            <TouchableOpacity onPress={fetchOverrides} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={16} color="#e50914" />
            </TouchableOpacity>
          </View>

          {loadingOverrides ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#e50914" />
              <Text style={styles.loadingText}>Fetching database overrides...</Text>
            </View>
          ) : overrides.length > 0 ? (
            <View style={styles.overrideList}>
              {overrides.map((item) => (
                <View key={item.tmdb_id} style={styles.overrideItemCard}>
                  <View style={styles.itemHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemMeta}>
                        TMDB ID: {item.tmdb_id} • {item.media_type.toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.actionRowBtn}>
                      <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
                        <Ionicons name="create-outline" size={16} color="#3b82f6" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(item.tmdb_id, item.title)} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.urlLabel}>CUSTOM STREAM:</Text>
                  <Text style={styles.urlSnippet} numberOfLines={1}>
                    {item.custom_stream_url}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#6b7280" />
              <Text style={styles.emptyText}>No stream overrides currently stored in database.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b0c0f',
  },
  container: {
    padding: 16,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  adminBadge: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  adminBadgeText: {
    color: '#e50914',
    fontSize: 10,
    fontWeight: '900',
  },
  formCard: {
    backgroundColor: '#12141a',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 16,
  },
  formSectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  formSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 17,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  rowInput: {
    flexDirection: 'row',
    gap: 8,
  },
  lookupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    gap: 6,
  },
  lookupBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  typePillActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    borderColor: '#e50914',
  },
  typePillText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
  },
  typePillTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e50914',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  listCard: {
    backgroundColor: '#12141a',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 14,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refreshBtn: {
    padding: 6,
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  overrideList: {
    gap: 10,
  },
  overrideItemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  itemMeta: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  actionRowBtn: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    padding: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 8,
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
  },
  urlLabel: {
    color: '#e50914',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  urlSnippet: {
    color: '#d1d5db',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  emptyBox: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 13,
  },
});
