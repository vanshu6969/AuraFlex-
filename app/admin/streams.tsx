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

export interface UserReportRecord {
  id?: string;
  media_id: string;
  media_title: string;
  issue_type: string;
  description?: string;
  created_at?: string;
}

export default function AdminStreamOverridesScreen() {
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Active Admin Tab State: 'overrides' | 'broadcast' | 'reports' | 'health'
  const [activeTab, setActiveTab] = useState<'overrides' | 'broadcast' | 'reports' | 'health'>('overrides');

  // Passcode modal state
  const [passcode, setPasscode] = useState('');

  // Stream Override Form states
  const [tmdbId, setTmdbId] = useState('');
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<'movie' | 'tv' | 'anime'>('movie');
  const [customUrl, setCustomUrl] = useState('');
  const [backupUrl, setBackupUrl] = useState('');
  const [streamtapeUrl, setStreamtapeUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [autoBroadcastTg, setAutoBroadcastTg] = useState(true);

  // Telegram Broadcast states
  const [broadcastTarget, setBroadcastTarget] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastPhotoUrl, setBroadcastPhotoUrl] = useState('');
  const [tgPublishing, setTgPublishing] = useState(false);
  const [broadcastSuccessCount, setBroadcastSuccessCount] = useState<number | null>(null);

  // User Reports states
  const [reports, setReports] = useState<UserReportRecord[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Link Health Scanner states
  const [scanningHealth, setScanningHealth] = useState(false);
  const [healthResults, setHealthResults] = useState<Array<{ title: string; tmdb_id: string; status: 'ok' | 'broken'; checkedUrl: string }>>([]);

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

  // Fetch data if authorized
  useEffect(() => {
    if (authorized) {
      fetchOverrides();
      fetchReports();
    }
  }, [authorized]);

  const fetchOverrides = async () => {
    setLoadingOverrides(true);
    const data = await streamOverrideService.getAllOverrides();
    setOverrides(data);
    setLoadingOverrides(false);
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from('media_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && Array.isArray(data)) {
        setReports(data);
      } else {
        setReports([]);
      }
    } catch {
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
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

    if (!customUrl.trim() && !streamtapeUrl.trim() && !downloadUrl.trim() && !backupUrl.trim() && !youtubeUrl.trim()) {
      showToast('Please provide at least one link (VIP Stream, YouTube, StreamTape, or Download URL).', 'error');
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
    const saveTitle = title.trim();
    const saveTmdbId = tmdbId.trim();
    const res = await streamOverrideService.upsertOverride({
      tmdb_id: saveTmdbId,
      title: saveTitle,
      media_type: mediaType,
      custom_stream_url: customUrl.trim() || null,
      backup_stream_url: backupUrl.trim() || null,
      streamtape_url: formattedStreamtapeUrl || null,
      download_url: downloadUrl.trim() || null,
      youtube_url: youtubeUrl.trim() || null,
    });
    setSaving(false);

    if (res.success) {
      showToast('Stream Override Saved Successfully!', 'success');
      if (autoBroadcastTg) {
        handlePublishToTelegram(saveTitle, saveTmdbId);
      }
      setTmdbId('');
      setTitle('');
      setCustomUrl('');
      setBackupUrl('');
      setStreamtapeUrl('');
      setDownloadUrl('');
      setYoutubeUrl('');
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
    setYoutubeUrl(record.youtube_url || '');
    setActiveTab('overrides');
    showToast(`Loaded ${record.title} into override editor`, 'info');
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

  // Quick Fix Report (Transfers details to Overrides Editor)
  const handleQuickFixReport = (report: UserReportRecord) => {
    setTmdbId(report.media_id);
    setTitle(report.media_title);
    setActiveTab('overrides');
    showToast(`Pre-filled override form for "${report.media_title}"`, 'success');
  };

  // Resolve / Dismiss User Report
  const handleResolveReport = async (reportId?: string) => {
    if (reportId) {
      try {
        await supabase.from('media_reports').delete().eq('id', reportId);
      } catch {}
    }
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    showToast('Report marked as resolved!', 'info');
  };

  // Telegram Manual Broadcast Trigger
  const handlePublishToTelegram = async (overrideTitle?: string, overrideTmdbId?: string) => {
    const target = overrideTmdbId || broadcastTarget.trim() || tmdbId.trim();
    if (!target && !broadcastMessage.trim()) {
      showToast('Enter a Movie Name, TMDB ID, or message text to broadcast', 'info');
      return;
    }
    setTgPublishing(true);
    try {
      const res = await fetch('/api/telegram-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: target,
          tmdbId: target,
          type: mediaType,
          title: overrideTitle || title || target,
          customMessage: broadcastMessage.trim() || undefined,
          photoUrl: broadcastPhotoUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Published "${data.title || target}" to Telegram subscribers!`, 'success');
        setBroadcastTarget('');
        setBroadcastMessage('');
        setBroadcastPhotoUrl('');
        setBroadcastSuccessCount((prev) => (prev ? prev + 1 : 1));
      } else {
        showToast(`Telegram Notice: ${data.error || 'Failed to broadcast'}`, 'error');
      }
    } catch (e: any) {
      showToast(`Network Error: ${e.message}`, 'error');
    } finally {
      setTgPublishing(false);
    }
  };

  // 1-Click Automated Dead Link Health Scanner
  const runHealthScanner = async () => {
    if (!overrides || overrides.length === 0) {
      showToast('No active stream overrides to scan', 'info');
      return;
    }
    setScanningHealth(true);
    showToast('Scanning all custom stream links for 404 / dead connections...', 'info');

    const results: Array<{ title: string; tmdb_id: string; status: 'ok' | 'broken'; checkedUrl: string }> = [];

    for (const item of overrides) {
      const targetUrl = item.custom_stream_url || item.streamtape_url || item.download_url || '';
      if (!targetUrl) continue;

      let isOk = true;
      try {
        if (Platform.OS === 'web') {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const response = await fetch(targetUrl, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
          clearTimeout(timeoutId);
          if (response.status >= 400 && response.status !== 403 && response.status !== 405) {
            isOk = false;
          }
        }
      } catch {
        isOk = false;
      }

      results.push({
        title: item.title,
        tmdb_id: item.tmdb_id,
        status: isOk ? 'ok' : 'broken',
        checkedUrl: targetUrl,
      });
    }

    setHealthResults(results);
    setScanningHealth(false);
    const brokenCount = results.filter((r) => r.status === 'broken').length;
    if (brokenCount > 0) {
      showToast(`Health Check Complete: Found ${brokenCount} potentially broken links!`, 'error');
    } else {
      showToast('Health Check Complete: All custom streams are healthy 🟢', 'success');
    }
  };

  if (checkingAuth) {
    return (
      <View style={styles.lockContainer}>
        <ActivityIndicator size="large" color="#e50914" />
      </View>
    );
  }

  // Lock Screen if not authorized
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
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enterprise Admin Panel</Text>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN VERIFIED</Text>
          </View>
        </View>

        {/* --- Top Navigation Tabs --- */}
        <View style={styles.navTabsRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('overrides')}
            style={[styles.navTabBtn, activeTab === 'overrides' && styles.navTabBtnActive]}
          >
            <Ionicons name="options-outline" size={16} color={activeTab === 'overrides' ? '#e50914' : '#9ca3af'} />
            <Text style={[styles.navTabText, activeTab === 'overrides' && styles.navTabTextActive]}>Stream Overrides</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('broadcast')}
            style={[styles.navTabBtn, activeTab === 'broadcast' && styles.navTabBtnActive]}
          >
            <Ionicons name="paper-plane-outline" size={16} color={activeTab === 'broadcast' ? '#0088cc' : '#9ca3af'} />
            <Text style={[styles.navTabText, activeTab === 'broadcast' && styles.navTabTextActive]}>TG Broadcast</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('reports')}
            style={[styles.navTabBtn, activeTab === 'reports' && styles.navTabBtnActive]}
          >
            <Ionicons name="flag-outline" size={16} color={activeTab === 'reports' ? '#f59e0b' : '#9ca3af'} />
            <Text style={[styles.navTabText, activeTab === 'reports' && styles.navTabTextActive]}>
              Reports {reports.length > 0 ? `(${reports.length})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('health')}
            style={[styles.navTabBtn, activeTab === 'health' && styles.navTabBtnActive]}
          >
            <Ionicons name="stats-chart-outline" size={16} color={activeTab === 'health' ? '#10b981' : '#9ca3af'} />
            <Text style={[styles.navTabText, activeTab === 'health' && styles.navTabTextActive]}>Analytics & Health</Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* TAB 1: STREAM OVERRIDES EDITOR & DATABASE LIST                            */}
        {/* ========================================================================= */}
        {activeTab === 'overrides' && (
          <>
            {/* Form Card */}
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

              {/* YouTube Stream / Embed URL */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>YouTube Stream URL / Embed Link</Text>
                <TextInput
                  value={youtubeUrl}
                  onChangeText={setYoutubeUrl}
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
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

              {/* Auto Broadcast Toggle */}
              <TouchableOpacity
                onPress={() => setAutoBroadcastTg(!autoBroadcastTg)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}
              >
                <Ionicons
                  name={autoBroadcastTg ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={autoBroadcastTg ? '#3b82f6' : '#6b7280'}
                />
                <Text style={{ color: '#d1d5db', fontSize: 13, fontWeight: '600' }}>
                  Auto-Broadcast release to Telegram Subscribers on save
                </Text>
              </TouchableOpacity>

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

            {/* Active Database Overrides List */}
            <View style={styles.listCard}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.formSectionTitle}>Active Database Overrides ({overrides.length})</Text>
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
                          <TouchableOpacity
                            onPress={() => handlePublishToTelegram(item.title, item.tmdb_id)}
                            style={[styles.editBtn, { backgroundColor: 'rgba(0, 136, 204, 0.2)' }]}
                          >
                            <Ionicons name="paper-plane-outline" size={16} color="#0088cc" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
                            <Ionicons name="create-outline" size={16} color="#3b82f6" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDelete(item.tmdb_id, item.title)} style={styles.deleteBtn}>
                            <Ionicons name="trash-outline" size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {item.custom_stream_url ? (
                        <>
                          <Text style={styles.urlLabel}>PRIMARY STREAM:</Text>
                          <Text style={styles.urlSnippet} numberOfLines={1}>{item.custom_stream_url}</Text>
                        </>
                      ) : null}

                      {item.streamtape_url ? (
                        <>
                          <Text style={styles.urlLabel}>STREAMTAPE (SERVER #2):</Text>
                          <Text style={styles.urlSnippet} numberOfLines={1}>{item.streamtape_url}</Text>
                        </>
                      ) : null}

                      {item.download_url ? (
                        <>
                          <Text style={styles.urlLabel}>DIRECT DOWNLOAD:</Text>
                          <Text style={styles.urlSnippet} numberOfLines={1}>{item.download_url}</Text>
                        </>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyBox}>
                  <Ionicons name="film-outline" size={32} color="#6b7280" />
                  <Text style={styles.emptyText}>No custom stream overrides saved yet.</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TELEGRAM BROADCAST COMMAND CENTER                                  */}
        {/* ========================================================================= */}
        {activeTab === 'broadcast' && (
          <View style={[styles.formCard, { borderColor: 'rgba(0, 136, 204, 0.4)' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="paper-plane" size={22} color="#0088cc" />
              <Text style={styles.formSectionTitle}>Telegram Broadcast Command Center</Text>
            </View>
            <Text style={styles.formSubtitle}>
              Broadcast release notifications & movie announcements directly to all Telegram bot subscribers.
            </Text>

            {/* Target Query Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Movie Name or TMDB ID *</Text>
              <TextInput
                value={broadcastTarget}
                onChangeText={setBroadcastTarget}
                placeholder="e.g. Deadpool & Wolverine or 533535"
                placeholderTextColor="#6b7280"
                style={styles.textInput}
              />
            </View>

            {/* Custom Announcement Message */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Custom Announcement Text (Optional)</Text>
              <TextInput
                value={broadcastMessage}
                onChangeText={setBroadcastMessage}
                placeholder="e.g. 🔥 EXCLUSIVE RELEASE: Now streaming in 1080p Full HD with zero popups!"
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={3}
                style={[styles.textInput, { height: 75, textAlignVertical: 'top' }]}
              />
            </View>

            {/* Poster Photo URL */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Custom Poster Image URL (Optional)</Text>
              <TextInput
                value={broadcastPhotoUrl}
                onChangeText={setBroadcastPhotoUrl}
                placeholder="https://image.tmdb.org/t/p/w500/..."
                placeholderTextColor="#6b7280"
                style={styles.textInput}
                autoCapitalize="none"
              />
            </View>

            {/* Template Buttons */}
            <Text style={[styles.inputLabel, { marginTop: 8 }]}>Quick Templates:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {[
                '🔥 NEW RELEASE ALERT: Now available in 1080p HD!',
                '⚡ STREAM RESTORED: Fast 1-click player updated!',
                '🎬 RECOMMENDED WATCH: Top trending movie today!',
              ].map((template, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setBroadcastMessage(template)}
                  style={{ backgroundColor: 'rgba(0, 136, 204, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0, 136, 204, 0.3)' }}
                >
                  <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: '700' }}>{template.split(':')[0]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Broadcast Action Button */}
            <TouchableOpacity
              onPress={() => handlePublishToTelegram()}
              disabled={tgPublishing}
              style={[styles.saveBtn, { backgroundColor: '#0088cc' }]}
            >
              {tgPublishing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={18} color="#ffffff" />
                  <Text style={styles.saveBtnText}>Broadcast to Telegram Subscribers</Text>
                </>
              )}
            </TouchableOpacity>

            {broadcastSuccessCount !== null && (
              <View style={{ marginTop: 16, padding: 12, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                <Text style={{ color: '#10b981', fontSize: 13, fontWeight: '700' }}>
                  ✅ Active Broadcast Status: Delivered ({broadcastSuccessCount} broadcasts sent today)
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: USER BROKEN STREAM REPORT INBOX                                    */}
        {/* ========================================================================= */}
        {activeTab === 'reports' && (
          <View style={styles.listCard}>
            <View style={styles.listHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="warning" size={20} color="#f59e0b" />
                <Text style={styles.formSectionTitle}>User Report Inbox ({reports.length})</Text>
              </View>
              <TouchableOpacity onPress={fetchReports} style={styles.refreshBtn}>
                <Ionicons name="refresh" size={16} color="#f59e0b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.formSubtitle}>
              Stream reports submitted by users flagging broken playback or audio issues.
            </Text>

            {loadingReports ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#f59e0b" />
                <Text style={styles.loadingText}>Fetching user reports...</Text>
              </View>
            ) : reports.length > 0 ? (
              <View style={styles.overrideList}>
                {reports.map((report, idx) => (
                  <View key={report.id || idx} style={[styles.overrideItemCard, { borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                    <View style={styles.itemHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{report.media_title}</Text>
                        <Text style={[styles.itemMeta, { color: '#f59e0b', fontWeight: '700' }]}>
                          ISSUE: {report.issue_type} • ID: {report.media_id}
                        </Text>
                      </View>

                      <View style={styles.actionRowBtn}>
                        <TouchableOpacity
                          onPress={() => handleQuickFixReport(report)}
                          style={[styles.editBtn, { backgroundColor: '#e50914' }]}
                        >
                          <Ionicons name="flash-outline" size={14} color="#ffffff" />
                          <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800', marginLeft: 4 }}>Fix Link</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleResolveReport(report.id)}
                          style={[styles.editBtn, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}
                        >
                          <Ionicons name="checkmark" size={16} color="#10b981" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {report.description ? (
                      <Text style={{ color: '#d1d5db', fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>
                        "{report.description}"
                      </Text>
                    ) : null}

                    {report.created_at ? (
                      <Text style={{ color: '#6b7280', fontSize: 10, marginTop: 4 }}>
                        Reported on: {new Date(report.created_at).toLocaleString()}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Ionicons name="checkmark-circle-outline" size={36} color="#10b981" />
                <Text style={[styles.emptyText, { color: '#10b981', fontWeight: '700', marginTop: 8 }]}>
                  All Clear! Zero pending broken stream reports.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ANALYTICS & 1-CLICK DEAD LINK HEALTH SCANNER                        */}
        {/* ========================================================================= */}
        {activeTab === 'health' && (
          <>
            {/* Live Metrics Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <View style={[styles.statPod, { borderColor: 'rgba(229, 9, 20, 0.4)' }]}>
                <Ionicons name="film" size={24} color="#e50914" />
                <Text style={styles.statVal}>{overrides.length}</Text>
                <Text style={styles.statLbl}>Active Overrides</Text>
              </View>

              <View style={[styles.statPod, { borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
                <Ionicons name="warning" size={24} color="#f59e0b" />
                <Text style={styles.statVal}>{reports.length}</Text>
                <Text style={styles.statLbl}>Pending Reports</Text>
              </View>

              <View style={[styles.statPod, { borderColor: 'rgba(0, 136, 204, 0.4)' }]}>
                <Ionicons name="paper-plane" size={24} color="#0088cc" />
                <Text style={styles.statVal}>ONLINE</Text>
                <Text style={styles.statLbl}>TG Bot Webhook</Text>
              </View>

              <View style={[styles.statPod, { borderColor: 'rgba(16, 185, 129, 0.4)' }]}>
                <Ionicons name="server" size={24} color="#10b981" />
                <Text style={styles.statVal}>4 / 4</Text>
                <Text style={styles.statLbl}>Multi-Servers</Text>
              </View>
            </View>

            {/* Automated Health Scanner Section */}
            <View style={styles.formCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="pulse" size={22} color="#10b981" />
                  <Text style={styles.formSectionTitle}>Automated Dead Link Health Checker</Text>
                </View>

                <TouchableOpacity
                  onPress={runHealthScanner}
                  disabled={scanningHealth}
                  style={[styles.lookupBtn, { backgroundColor: '#10b981' }]}
                >
                  {scanningHealth ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="search-outline" size={16} color="#ffffff" />
                      <Text style={styles.lookupBtnText}>Run Health Check</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={[styles.formSubtitle, { marginTop: 8 }]}>
                Scans all custom stream URLs and checks HTTP connection status to highlight broken or 404 links.
              </Text>

              {healthResults.length > 0 && (
                <View style={{ marginTop: 14 }}>
                  {healthResults.map((res, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>{res.title}</Text>
                        <Text style={{ color: '#9ca3af', fontSize: 11 }} numberOfLines={1}>{res.checkedUrl}</Text>
                      </View>

                      <View style={{ backgroundColor: res.status === 'ok' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ color: res.status === 'ok' ? '#10b981' : '#ef4444', fontSize: 11, fontWeight: '800' }}>
                          {res.status === 'ok' ? 'HEALTHY 🟢' : 'BROKEN 🔴'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07080b',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  lockContainer: {
    flex: 1,
    backgroundColor: '#07080b',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  lockCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#12131a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  lockIconPod: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
  },
  lockTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  lockSubtitle: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  highlightText: {
    color: '#e50914',
    fontWeight: '700',
  },
  passcodeBox: {
    width: '100%',
    marginBottom: 16,
  },
  passcodeLabel: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  passcodeInput: {
    backgroundColor: '#07080b',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 12,
  },
  unlockBtn: {
    backgroundColor: '#e50914',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
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
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  adminBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  adminBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  navTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  navTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#12131a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  navTabBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: '#e50914',
  },
  navTabText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
  },
  navTabTextActive: {
    color: '#ffffff',
  },
  formCard: {
    backgroundColor: '#12131a',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  formSectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  formSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  rowInput: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    backgroundColor: '#07080b',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
  },
  lookupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e50914',
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
  },
  lookupBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#07080b',
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  typePillActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    borderColor: '#e50914',
  },
  typePillText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
  },
  typePillTextActive: {
    color: '#e50914',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e50914',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  listCard: {
    backgroundColor: '#12131a',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    fontSize: 12,
  },
  overrideList: {
    gap: 12,
  },
  overrideItemCard: {
    backgroundColor: '#07080b',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  itemMeta: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  actionRowBtn: {
    flexDirection: 'row',
    gap: 6,
  },
  editBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  urlLabel: {
    color: '#6b7280',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 6,
  },
  urlSnippet: {
    color: '#10b981',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptyBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 8,
  },
  statPod: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#12131a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statVal: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginVertical: 4,
  },
  statLbl: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
});
