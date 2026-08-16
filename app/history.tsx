import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { storageService, subscribeStorage } from '../lib/storage';
import { WatchProgress } from '../types/media';
import { useTheme } from '../lib/themeContext';

export default function WatchHistoryScreen() {
  const [history, setHistory] = useState<WatchProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  const loadHistory = async () => {
    try {
      const items = await storageService.getContinueWatching();
      setHistory(items);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    const unsubscribe = subscribeStorage(loadHistory);
    return () => unsubscribe();
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/more');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Watch History',
      'Are you sure you want to clear your watch history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearHistory();
            setHistory([]);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Watch History</Text>
        </View>

        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#e50914" />
        </View>
      ) : history.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="time-outline" size={36} color="#e50914" />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Watch History</Text>
          <Text style={styles.emptySubtitle}>Titles you watch will appear here so you can easily resume playback.</Text>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.exploreBtn}>
            <Text style={styles.exploreBtnText}>Explore Trending Media</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.historyList}>
          {history.map((item, index) => {
            const mediaType = item.media?.media_type || 'movie';

            return (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(`/watch/${mediaType}/${item.mediaId}`)}
                activeOpacity={0.8}
                style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Image source={{ uri: item.media?.poster_path }} style={styles.posterImg} />

                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.media?.title}
                  </Text>

                  {mediaType !== 'movie' ? (
                    <Text style={styles.epSub}>
                      Season {item.season || 1} • Episode {item.episode || 1}
                    </Text>
                  ) : (
                    <Text style={styles.epSub}>Movie • {item.media?.quality || 'HD'}</Text>
                  )}

                  <View style={styles.cardFooter}>
                    <View style={styles.playBadge}>
                      <Ionicons name="play" size={12} color="#ffffff" />
                      <Text style={styles.playText}>Resume Playback</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#18181f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  clearBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
    marginBottom: 20,
  },
  exploreBtn: {
    backgroundColor: '#e50914',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    flexDirection: 'row',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    padding: 10,
    gap: 12,
  },
  posterImg: {
    width: 75,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  epSub: {
    color: '#e50914',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  playBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e50914',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  playText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
