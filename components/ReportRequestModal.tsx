import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { sendDiscordReport, sendDiscordRequest, getDiscordWebhookUrl, setDiscordWebhookUrl } from '../lib/discordWebhook';

interface ReportRequestModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'report' | 'request';
  prefilledMediaTitle?: string;
  prefilledMediaId?: string;
}

export const ReportRequestModal: React.FC<ReportRequestModalProps> = ({
  visible,
  onClose,
  initialTab = 'report',
  prefilledMediaTitle = '',
  prefilledMediaId = '',
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'request'>(initialTab);

  // Report Form State
  const [reportTitle, setReportTitle] = useState(prefilledMediaTitle);
  const [reportIssueType, setReportIssueType] = useState('Broken Video / Cannot Play');
  const [reportDetails, setReportDetails] = useState('');

  // Request Form State
  const [requestTitle, setRequestTitle] = useState('');
  const [requestMediaType, setRequestMediaType] = useState<'movie' | 'tv' | 'anime' | 'kdrama'>('movie');
  const [requestYear, setRequestYear] = useState('');
  const [requestNotes, setRequestNotes] = useState('');

  // Webhook Config State
  const [webhookUrl, setWebhookUrlInput] = useState('');
  const [showWebhookSettings, setShowWebhookSettings] = useState(false);

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
    if (prefilledMediaTitle) setReportTitle(prefilledMediaTitle);
    getDiscordWebhookUrl().then(setWebhookUrlInput);
  }, [initialTab, prefilledMediaTitle, visible]);

  const saveWebhookConfig = async () => {
    await setDiscordWebhookUrl(webhookUrl);
    setShowWebhookSettings(false);
    setStatusMsg({ type: 'success', text: 'Discord Webhook URL saved successfully!' });
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleReportSubmit = async () => {
    if (!reportTitle.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter the title of the movie or show.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    let userEmail: string | undefined;
    let userId: string | null = null;

    try {
      const { data: session } = await supabase.auth.getSession();
      userEmail = session?.session?.user?.email || undefined;
      userId = session?.session?.user?.id || null;
    } catch {}

    // 1. Send Discord Webhook Notification FIRST
    let discordSent = false;
    try {
      discordSent = await sendDiscordReport({
        mediaTitle: reportTitle.trim(),
        issueType: reportIssueType,
        description: reportDetails.trim(),
        userEmail,
      });
    } catch (err) {
      console.error('Discord report error:', err);
    }

    // 2. Save to Supabase DB (safely ignored if schema or RLS fails)
    try {
      await supabase.from('media_reports').insert({
        user_id: userId,
        media_id: prefilledMediaId || reportTitle.toLowerCase().replace(/\s+/g, '-'),
        media_title: reportTitle.trim(),
        issue_type: reportIssueType,
        description: reportDetails.trim(),
      });
    } catch (dbErr) {
      console.warn('Supabase DB report insert error:', dbErr);
    }

    if (discordSent) {
      setStatusMsg({
        type: 'success',
        text: '🚨 Broken movie report sent to Discord! Our team has been notified.',
      });
    } else {
      setStatusMsg({
        type: 'success',
        text: 'Report submitted! (Tip: Check Discord Webhook settings for instant alerts)',
      });
    }

    setReportDetails('');
    setLoading(false);
    setTimeout(() => {
      setStatusMsg(null);
      onClose();
    }, 2200);
  };

  const handleRequestSubmit = async () => {
    if (!requestTitle.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter the name of the movie or series you want.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    let userEmail: string | undefined;
    let userId: string | null = null;

    try {
      const { data: session } = await supabase.auth.getSession();
      userEmail = session?.session?.user?.email || undefined;
      userId = session?.session?.user?.id || null;
    } catch {}

    // 1. Send Discord Webhook Notification FIRST
    let discordSent = false;
    try {
      discordSent = await sendDiscordRequest({
        title: requestTitle.trim(),
        mediaType: requestMediaType,
        year: requestYear.trim(),
        notes: requestNotes.trim(),
        userEmail,
      });
    } catch (err) {
      console.error('Discord request error:', err);
    }

    // 2. Save to Supabase DB (safely ignored if schema or RLS fails)
    try {
      await supabase.from('media_requests').insert({
        user_id: userId,
        title: requestTitle.trim(),
        media_type: requestMediaType,
        release_year: requestYear.trim(),
        notes: requestNotes.trim(),
      });
    } catch (dbErr) {
      console.warn('Supabase DB request insert error:', dbErr);
    }

    if (discordSent) {
      setStatusMsg({
        type: 'success',
        text: '🎬 Media request sent to Discord! We will add it soon.',
      });
    } else {
      setStatusMsg({
        type: 'success',
        text: 'Request submitted! (Tip: Check Discord Webhook settings for instant alerts)',
      });
    }

    setRequestTitle('');
    setRequestNotes('');
    setRequestYear('');
    setLoading(false);
    setTimeout(() => {
      setStatusMsg(null);
      onClose();
    }, 2200);
  };

  const issueOptions = [
    'Broken Video / Cannot Play',
    'Subtitles Missing or Incorrect',
    'Audio Out of Sync / Wrong Audio',
    'Wrong Episode / Season Content',
    'Buffering / Slow Playback',
    'Other Issue',
  ];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Modal Header Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => {
                setActiveTab('report');
                setStatusMsg(null);
              }}
              style={[styles.tabBtn, activeTab === 'report' && styles.tabBtnActive]}
            >
              <Ionicons name="warning-outline" size={16} color={activeTab === 'report' ? '#ffffff' : '#9ca3af'} />
              <Text style={[styles.tabText, activeTab === 'report' && styles.tabTextActive]}>Report Issue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActiveTab('request');
                setStatusMsg(null);
              }}
              style={[styles.tabBtn, activeTab === 'request' && styles.tabBtnActive]}
            >
              <Ionicons name="film-outline" size={16} color={activeTab === 'request' ? '#ffffff' : '#9ca3af'} />
              <Text style={[styles.tabText, activeTab === 'request' && styles.tabTextActive]}>Request Media</Text>
            </TouchableOpacity>
          </View>

          {statusMsg && (
            <View
              style={[
                styles.alertBox,
                statusMsg.type === 'success' ? styles.alertSuccess : styles.alertError,
              ]}
            >
              <Ionicons
                name={statusMsg.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={statusMsg.type === 'success' ? '#34d399' : '#f87171'}
              />
              <Text style={[styles.alertText, statusMsg.type === 'success' ? styles.alertTextSuccess : styles.alertTextError]}>
                {statusMsg.text}
              </Text>
            </View>
          )}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {activeTab === 'report' ? (
              /* REPORT BROKEN MEDIA FORM */
              <View style={styles.formContainer}>
                <Text style={styles.formDesc}>
                  Having trouble playing a movie or series episode? Let us know and a Discord alert will notify our team.
                </Text>

                {/* Title Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>MOVIE / SHOW TITLE</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="film" size={16} color="#9ca3af" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Demon Slayer, Fight Club"
                      placeholderTextColor="#6b7280"
                      value={reportTitle}
                      onChangeText={setReportTitle}
                    />
                  </View>
                </View>

                {/* Issue Type Select */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>WHAT IS THE ISSUE?</Text>
                  <View style={styles.chipGrid}>
                    {issueOptions.map((opt) => {
                      const isActive = reportIssueType === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          onPress={() => setReportIssueType(opt)}
                          style={[styles.chip, isActive && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{opt}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Details Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ADDITIONAL DETAILS (OPTIONAL)</Text>
                  <View style={[styles.inputBox, { height: 75, alignItems: 'flex-start' }]}>
                    <TextInput
                      style={[styles.textInput, { height: '100%', textAlignVertical: 'top' }]}
                      placeholder="Describe what happens (e.g. black screen, Season 2 Episode 3 broken server)..."
                      placeholderTextColor="#6b7280"
                      multiline
                      value={reportDetails}
                      onChangeText={setReportDetails}
                    />
                  </View>
                </View>

                <TouchableOpacity onPress={handleReportSubmit} disabled={loading} style={styles.submitBtn}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="logo-discord" size={18} color="#ffffff" />
                      <Text style={styles.submitBtnText}>Send Discord Report</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* REQUEST NEW MEDIA FORM */
              <View style={styles.formContainer}>
                <Text style={styles.formDesc}>
                  Can't find a movie or show on AuraFlex? Request it here and a Discord alert will notify our team.
                </Text>

                {/* Request Title Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>REQUESTED TITLE</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="search" size={16} color="#9ca3af" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Deadpool & Wolverine, Solo Leveling"
                      placeholderTextColor="#6b7280"
                      value={requestTitle}
                      onChangeText={setRequestTitle}
                    />
                  </View>
                </View>

                {/* Media Type Pills */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>MEDIA TYPE</Text>
                  <View style={styles.chipRow}>
                    {(['movie', 'tv', 'anime', 'kdrama'] as const).map((t) => {
                      const isActive = requestMediaType === t;
                      const label = t === 'movie' ? 'Movie' : t === 'tv' ? 'TV Series' : t === 'anime' ? 'Anime' : 'Asian Drama';
                      return (
                        <TouchableOpacity
                          key={t}
                          onPress={() => setRequestMediaType(t)}
                          style={[styles.chip, isActive && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Release Year Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>RELEASE YEAR (OPTIONAL)</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 2024"
                      placeholderTextColor="#6b7280"
                      keyboardType="numeric"
                      value={requestYear}
                      onChangeText={setRequestYear}
                    />
                  </View>
                </View>

                {/* Request Notes */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>NOTES / SPECIFIC SEASON</Text>
                  <View style={[styles.inputBox, { height: 65, alignItems: 'flex-start' }]}>
                    <TextInput
                      style={[styles.textInput, { height: '100%', textAlignVertical: 'top' }]}
                      placeholder="e.g. Please add in 1080p with English dub/sub..."
                      placeholderTextColor="#6b7280"
                      multiline
                      value={requestNotes}
                      onChangeText={setRequestNotes}
                    />
                  </View>
                </View>

                <TouchableOpacity onPress={handleRequestSubmit} disabled={loading} style={styles.submitBtn}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="logo-discord" size={18} color="#ffffff" />
                      <Text style={styles.submitBtnText}>Send Discord Request</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Collapsible Discord Webhook Settings Button */}
            <View style={styles.webhookSettingContainer}>
              <TouchableOpacity
                onPress={() => setShowWebhookSettings(!showWebhookSettings)}
                style={styles.webhookToggleBtn}
              >
                <Ionicons name="settings-outline" size={14} color="#9ca3af" />
                <Text style={styles.webhookToggleText}>
                  {showWebhookSettings ? 'Hide Discord Webhook Settings' : '⚙️ Configure Discord Webhook URL'}
                </Text>
              </TouchableOpacity>

              {showWebhookSettings && (
                <View style={styles.webhookBox}>
                  <Text style={styles.label}>DISCORD WEBHOOK URL</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="link" size={16} color="#5865F2" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="https://discord.com/api/webhooks/..."
                      placeholderTextColor="#6b7280"
                      value={webhookUrl}
                      onChangeText={setWebhookUrlInput}
                      autoCapitalize="none"
                    />
                  </View>
                  <TouchableOpacity onPress={saveWebhookConfig} style={styles.saveWebhookBtn}>
                    <Text style={styles.saveWebhookText}>Save Webhook URL</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    backgroundColor: '#18181f',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#0f0f12',
    zIndex: 10,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#0f0f12',
    padding: 4,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#e50914',
  },
  tabText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
  },
  alertSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  alertError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  alertText: {
    fontSize: 12,
    flex: 1,
  },
  alertTextSuccess: {
    color: '#34d399',
  },
  alertTextError: {
    color: '#f87171',
  },
  formScroll: {
    maxHeight: 520,
  },
  formContainer: {
    gap: 14,
  },
  formDesc: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f12',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0f0f12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipActive: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  chipText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5865F2', // Discord Blurple (#5865F2)
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  webhookSettingContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
  },
  webhookToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  webhookToggleText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  webhookBox: {
    marginTop: 10,
    gap: 8,
    backgroundColor: '#0f0f12',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(88, 101, 242, 0.3)',
  },
  saveWebhookBtn: {
    backgroundColor: '#5865F2',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  saveWebhookText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
