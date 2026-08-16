import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MobileHeroBanner } from '../../components/MobileHeroBanner';
import { MobileMediaGrid } from '../../components/MobileMediaGrid';
import { tmdbService } from '../../lib/tmdb';
import { storageService, subscribeStorage } from '../../lib/storage';
import { MediaItem, WatchProgress } from '../../types/media';
import { useTheme } from '../../lib/themeContext';

export default function HomeScreen() {
  const [featured, setFeatured] = useState<MediaItem | null>(null);
  const [continueWatching, setContinueWatching] = useState<WatchProgress[]>([]);
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [topTVShows, setTopTVShows] = useState<MediaItem[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<MediaItem[]>([]);
  const { colors } = useTheme();

  const loadData = async () => {
    try {
      const items = await storageService.getContinueWatching();
      setContinueWatching(items);

      const trendingData = await tmdbService.getTrending();
      setTrending(trendingData);

      if (trendingData.length > 0) {
        setFeatured(trendingData[0]);
      }

      const movies = await tmdbService.getPopularMovies();
      setPopularMovies(movies);

      const tv = await tmdbService.getTopTVShows();
      setTopTVShows(tv);

      setRecentlyAdded([...trendingData].reverse().slice(0, 8));
    } catch (e) {
      console.error('Home load error:', e);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeStorage(loadData);
    return () => unsubscribe();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      {/* Featured Hero Banner */}
      {(trending.length > 0 || featured) && (
        <MobileHeroBanner items={trending.length > 0 ? trending : (featured ? [featured] : [])} />
      )}

      {/* Continue Watching Section (No Progress Bar / % Text) */}
      {continueWatching.length > 0 && (
        <View style={styles.continueSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={18} color="#e50914" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Continue Watching</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.continueList}>
            {continueWatching.map((item) => (
              <TouchableOpacity
                key={item.mediaId}
                activeOpacity={0.8}
                onPress={() => router.push(`/watch/${item.media?.media_type || 'movie'}/${item.media?.id}`)}
                style={[styles.continueCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Image source={{ uri: item.media?.backdrop_path || item.media?.poster_path }} style={styles.continueBackdrop} resizeMode="cover" />
                <View style={styles.playOverlay}>
                  <View style={styles.playIconBox}>
                    <Ionicons name="play" size={16} color="#ffffff" />
                  </View>
                </View>
                <View style={styles.continueInfo}>
                  <Text style={[styles.continueTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.media?.title}
                  </Text>
                  <Text style={styles.continueSubtitle}>
                    {item.season && item.episode
                      ? `Season ${item.season} • Episode ${item.episode}`
                      : 'Movie • Resume'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Media Rows */}
      <MobileMediaGrid title="🔥 Trending Now" items={trending} variant="carousel" />
      <MobileMediaGrid title="🎬 Popular Movies" items={popularMovies} variant="carousel" />
      <MobileMediaGrid title="📺 Top Rated TV Series" items={topTVShows} variant="carousel" />
      <MobileMediaGrid title="✨ Recently Added" items={recentlyAdded} variant="grid" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 16,
    fontWeight: '800',
  },
  continueList: {
    gap: 12,
  },
  continueCard: {
    width: 220,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
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
  continueInfo: {
    padding: 10,
  },
  continueTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  continueSubtitle: {
    color: '#e50914',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
