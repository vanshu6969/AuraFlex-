import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';

import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MobileHeroBanner } from '../../components/MobileHeroBanner';
import { MobileMediaGrid } from '../../components/MobileMediaGrid';
import { MOCK_MEDIA_ITEMS } from '../../lib/mediaData';
import { tmdbService } from '../../lib/tmdb';
import { storageService, subscribeStorage } from '../../lib/storage';
import { MediaItem, WatchProgress } from '../../types/media';


import { fetchTrendingAnime, mapAniListToMediaItem } from '../../lib/anilist';

export default function HomeScreen() {
  const [continueWatching, setContinueWatching] = useState<WatchProgress[]>([]);
  const [trending, setTrending] = useState<MediaItem[]>(MOCK_MEDIA_ITEMS);
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [topTVShows, setTopTVShows] = useState<MediaItem[]>([]);
  const [trendingAnime, setTrendingAnime] = useState<MediaItem[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<MediaItem[]>([]);

  useEffect(() => {
    storageService.getContinueWatching().then(setContinueWatching);
    const unsubscribe = subscribeStorage(() => {
      storageService.getContinueWatching().then(setContinueWatching);
    });

    tmdbService.getTrending().then(setTrending);
    tmdbService.getPopularMovies().then(setPopularMovies);
    tmdbService.getTopTVShows().then(setTopTVShows);
    tmdbService.getRecentlyAdded().then(setRecentlyAdded);
    fetchTrendingAnime().then((list) => setTrendingAnime(list.map(mapAniListToMediaItem)));

    return unsubscribe;
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Carousel */}
      <MobileHeroBanner items={trending} />

      {/* Continue Watching */}
      {continueWatching.length > 0 && (
        <View style={styles.continueSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={18} color="#e50914" />
            <Text style={styles.sectionTitle}>Continue Watching</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.continueList}>
            {continueWatching.map((item) => (
              <TouchableOpacity
                key={item.mediaId}
                activeOpacity={0.8}
                onPress={() => router.push(`/watch/${item.media.media_type}/${item.media.id}`)}
                style={styles.continueCard}
              >
                <Image source={{ uri: item.media.backdrop_path }} style={styles.continueBackdrop} resizeMode="cover" />
                <View style={styles.playOverlay}>
                  <View style={styles.playIconBox}>
                    <Ionicons name="play" size={16} color="#ffffff" />
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${Math.min(100, (item.currentTime / (item.duration || 1)) * 100)}%` },
                    ]}
                  />
                </View>
                <View style={styles.continueInfo}>
                  <Text style={styles.continueTitle} numberOfLines={1}>
                    {item.media.title}
                  </Text>
                  <Text style={styles.continueSubtitle}>
                    {item.season && item.episode
                      ? `S${item.season} E${item.episode}`
                      : `${Math.floor(item.currentTime / 60)} min left`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Media Rows */}
      <MobileMediaGrid title="🔥 Trending Now" items={trending} variant="carousel" />
      <MobileMediaGrid title="🎌 Trending Anime" items={trendingAnime} variant="carousel" />
      <MobileMediaGrid title="🎬 Popular Movies" items={popularMovies} variant="carousel" />
      <MobileMediaGrid title="📺 Top Rated TV Series" items={topTVShows} variant="carousel" />
      <MobileMediaGrid title="✨ Recently Added" items={recentlyAdded} variant="grid" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f12',
  },
  continueSection: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  continueList: {
    gap: 12,
  },
  continueCard: {
    width: 220,
    backgroundColor: '#18181f',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  continueBackdrop: {
    width: '100%',
    height: 110,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: 110,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e50914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#e50914',
  },
  continueInfo: {
    padding: 8,
  },
  continueTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  continueSubtitle: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 2,
  },
});
