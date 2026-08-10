import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { storageService, subscribeStorage } from '../lib/storage';
import { WatchProgress } from '../types/media';

export default function WatchHistoryScreen() {
  const [history, setHistory] = useState<WatchProgress[]>([]);
  const [loading, setLoading] = useState(true);

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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Watch History</Text>
        </View>

        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
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
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="time-outline" size={36} color="#e50914" />
          </View>
          <Text style={styles.emptyTitle}>No Watch History</Text>
          <Text style={styles.emptySubtitle}>Titles you watch will appear here so you can easily resume playback.</Text>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.exploreBtn}>
            <Text style={styles.exploreBtnText}>Explore Trending Media</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.historyList}>
          {history.map((item, index) => {
            const percent = Math.min(100, Math.max(5, Math.round((item.currentTime / (item.duration || 1)) * 100)));
            const mediaType = item.media.media_type || 'movie';

            return (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(`/watch/${mediaType}/${item.mediaId}`)}
                activeOpacity={0.8}
                style={styles.historyCard}
              >
                <Image source={{ uri: item.media.poster_path }} style={styles.posterImg} />

                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.media.title}
                  </Text>

                  {mediaType !== 'movie' ? (
                    <Text style={styles.epSub}>
                      Season {item.season || 1} • Episode {item.episode || 1}
                    </Text>
                  ) : (
                    <Text style={styles.epSub}>Movie • {item.media.quality || 'HD'}</Text>
                  )}

                  {/* Progress Bar */}
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${percent}%` }]} />
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.percentText}>{percent}% watched</Text>
                    <View style={styles.playBadge}>
                      <Ionicons name="play" size={12} color="#ffffff" />
                      <Text style={styles.playText}>Resume</Text>
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
    backgroundColor: '#0f0f12',
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  clearBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    padding: 60,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#18181f',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 240,
  },
  exploreBtn: {
    backgroundColor: '#e50914',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: '#18181f',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    gap: 12,
  },
  posterImg: {
    width: 70,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#0f0f12',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  epSub: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e50914',
    borderRadius: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  percentText: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
  },
  playBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e50914',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  playText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
});
