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
import { supabase } from '../../lib/supabase';

const ADMIN_EMAIL = 'tajinderyt1@gmail.com';
const SECRET_PASSCODE = process.env.EXPO_PUBLIC_ADMIN_PASSCODE || 'auraflex786';

export default function AdminStreamOverridesScreen() {
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Passcode modal state
  const [passcode, setPasscode] = useState('');

  // Form states
  const [tmdbId, setTmdbId] = useState('');
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<'movie' | 'tv' | 'anime'>('movie');
  const [customUrl, setCustomUrl] = useState('');
  const [backupUrl, setBackupUrl] = useState('');
  const [streamtapeUrl, setStreamtapeUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  const [lookupLoading, setLookupLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [overrides, setOverrides] = useState<StreamOverrideRecord[]>([]);
  const [loadingOverrides, setLoadingOverrides] = useState(true);

  // Check logged in user session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email?.toLowerCase();
      setUserEmail(email || null);
      if (email === ADMIN_EMAIL) {
        setAuthorized(true);
      }
      setCheckingAuth(false);
    });
  }, []);

  // Fetch stream overrides if authorized
  useEffect(() => {
    if (authorized) {
      fetchOverrides();
    }
  }, [authorized]);

  const fetchOverrides = async () => {
    setLoadingOverrides(true);
    const data = await streamOverrideService.getAllOverrides();
    setOverrides(data);
    setLoadingOverrides(false);
  };

  const handleVerifyPasscode = () => {
    if (passcode.trim() === SECRET_PASSCODE) {
      setAuthorized(true);
      showToast('Admin Access Granted via Passcode', 'success');
    } else {
      showToast('Invalid Secret Passcode', 'error');
    }
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
    if (!tmdbId.trim() || !title.trim()) {
      showToast('Please enter a TMDB ID and Title.', 'error');
      return;
    }

    // Ensure at least ONE link is provided
    if (!customUrl.trim() && !streamtapeUrl.trim() && !downloadUrl.trim() && !backupUrl.trim()) {
      showToast('Please provide at least one link (VIP Stream, StreamTape, or Download URL).', 'error');
      return;
    }

    let formattedStreamtapeUrl = streamtapeUrl.trim();
    if (formattedStreamtapeUrl) {
      if (!/^https?:\/\//i.test(formattedStreamtapeUrl)) {
        formattedStreamtapeUrl = `https://${formattedStreamtapeUrl}`;
      }
      formattedStreamtapeUrl = formattedStreamtapeUrl.replace(/\/v\//i, '/e/');
      formattedStreamtapeUrl = formattedStreamtapeUrl.replace(/streamtape\.com/i, 'streamtape.to');
    }

    setSaving(true);
    const res = await streamOverrideService.upsertOverride({
      tmdb_id: tmdbId.trim(),
      title: title.trim(),
      media_type: mediaType,
      custom_stream_url: customUrl.trim() || null,
      backup_stream_url: backupUrl.trim() || null,
      streamtape_url: formattedStreamtapeUrl || null,
      download_url: downloadUrl.trim() || null,
    });
    setSaving(false);

    if (res.success) {
      showToast('Stream Override Saved Successfully!', 'success');
      setTmdbId('');
      setTitle('');
      setCustomUrl('');
      setBackupUrl('');
      setStreamtapeUrl('');
      setDownloadUrl('');
      fetchOverrides();
    } else {
      showToast(`Database Error: ${res.error || 'Failed to save stream override'}`, 'error');
    }
  };

  // Populate Form for Editing
  const handleEdit = (record: StreamOverrideRecord) => {
    setTmdbId(record.tmdb_id);
    setTitle(record.title);
    setMediaType(record.media_type);
    setCustomUrl(record.custom_stream_url || '');
    setBackupUrl(record.backup_stream_url || '');
    setStreamtapeUrl(record.streamtape_url || '');
    setDownloadUrl(record.download_url || '');
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

  if (checkingAuth) {
    return (
      <View style={styles.lockContainer}>
        <ActivityIndicator size="large" color="#e50914" />
      </View>
    );
  }

  // Lock Screen if not logged in as tajinderyt1@gmail.com and no valid passcode
  if (!authorized) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.lockContainer}>
          <View style={styles.lockCard}>
            <View style={styles.lockIconPod}>
              <Ionicons name="lock-closed" size={32} color="#e50914" />
            </View>

            <Text style={styles.lockTitle}>Admin Verification Required</Text>
            <Text style={styles.lockSubtitle}>
              Automatic access is granted when signed in as <Text style={styles.highlightText}>{ADMIN_EMAIL}</Text>.
              {userEmail ? ` Current user: ${userEmail}` : ' You are currently not signed in.'}
            </Text>

            <View style={styles.passcodeBox}>
              <Text style={styles.passcodeLabel}>Enter Secret Passcode</Text>
              <TextInput
                value={passcode}
                onChangeText={setPasscode}
                placeholder="Admin Passcode"
                placeholderTextColor="#6b7280"
                secureTextEntry
                style={styles.passcodeInput}
              />
              <TouchableOpacity onPress={handleVerifyPasscode} style={styles.unlockBtn}>
                <Text style={styles.unlockBtnText}>Unlock Admin Panel</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => router.back()} style={styles.cancelLockBtn}>
              <Text style={styles.cancelLockText}>Return to App</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.adminBadgeText}>ADMIN VERIFIED</Text>
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
            <Text style={styles.inputLabel}>Custom Primary Stream URL (VIP Server #1)</Text>
            <TextInput
              value={customUrl}
              onChangeText={setCustomUrl}
              placeholder="https://embed.provider.com/movie/550 or HLS stream link"
              placeholderTextColor="#6b7280"
              style={styles.textInput}
              autoCapitalize="none"
            />
          </View>

          {/* StreamTape Embed URL */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>StreamTape Embed URL (Server #2)</Text>
            <TextInput
              value={streamtapeUrl}
              onChangeText={setStreamtapeUrl}
              placeholder="https://streamtape.com/e/..."
              placeholderTextColor="#6b7280"
              style={styles.textInput}
              autoCapitalize="none"
            />
          </View>

          {/* Direct Download URL */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Direct Download URL</Text>
            <TextInput
              value={downloadUrl}
              onChangeText={setDownloadUrl}
              placeholder="https://download.provider.com/file.mp4"
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

                  <Text style={styles.urlLabel}>PRIMARY STREAM:</Text>
                  <Text style={styles.urlSnippet} numberOfLines={1}>
                    {item.custom_stream_url}
                  </Text>

                  {item.streamtape_url ? (
                    <>
                      <Text style={styles.urlLabel}>STREAMTAPE (SERVER #2):</Text>
                      <Text style={styles.urlSnippet} numberOfLines={1}>
                        {item.streamtape_url}
                      </Text>
                    </>
                  ) : null}

                  {item.download_url ? (
                    <>
                      <Text style={styles.urlLabel}>DIRECT DOWNLOAD:</Text>
                      <Text style={styles.urlSnippet} numberOfLines={1}>
                        {item.download_url}
                      </Text>
                    </>
                  ) : null}
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
  lockContainer: {
    flex: 1,
    backgroundColor: '#0b0c0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  lockCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#12141a',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    gap: 14,
  },
  lockIconPod: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  lockTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  lockSubtitle: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  highlightText: {
    color: '#e50914',
    fontWeight: '700',
  },
  passcodeBox: {
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
  passcodeLabel: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '700',
  },
  passcodeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 2,
  },
  unlockBtn: {
    backgroundColor: '#e50914',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  unlockBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelLockBtn: {
    paddingVertical: 8,
  },
  cancelLockText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  adminBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: '#12141a',
    borderRadius: 20,
    padding: 20,
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
    marginTop: -8,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '700',
  },
  rowInput: {
    flexDirection: 'row',
    gap: 10,
  },
  textInput: {
    backgroundColor: '#0b0c0f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  lookupBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lookupBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typePill: {
    flex: 1,
    backgroundColor: '#0b0c0f',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  typePillActive: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  typePillText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
  },
  typePillTextActive: {
    color: '#ffffff',
  },
  saveBtn: {
    backgroundColor: '#e50914',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  listCard: {
    backgroundColor: '#12141a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 16,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshBtn: {
    padding: 6,
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  overrideList: {
    gap: 12,
  },
  overrideItemCard: {
    backgroundColor: '#0b0c0f',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  itemMeta: {
    color: '#6b7280',
    fontSize: 11,
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
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  urlSnippet: {
    color: '#34d399',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 13,
  },
});
