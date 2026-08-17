import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MobileHeroBanner } from '../../components/MobileHeroBanner';
import { MobileMediaGrid } from '../../components/MobileMediaGrid';
import { ContinueWatchingCard } from '../../components/ContinueWatchingCard';
import { Top10MediaRow } from '../../components/Top10MediaRow';
import { CategoryPillBar } from '../../components/CategoryPillBar';
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
  const [activeCategory, setActiveCategory] = useState('all');
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

      const recent = await tmdbService.getRecentlyAdded();
      setRecentlyAdded(recent.length > 0 ? recent.slice(0, 18) : [...trendingData].reverse().slice(0, 18));
    } catch (e) {
      console.error('Home load error:', e);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeStorage(loadData);
    return () => unsubscribe();
  }, []);

  const handleSelectCategory = (catId: string) => {
    setActiveCategory(catId);
    if (catId === 'punjabi' || catId === 'kdrama' || catId === 'series') {
      router.push('/series');
    } else if (catId === 'movies') {
      router.push('/search?type=movie');
    } else if (catId === 'anime') {
      router.push('/search?query=anime');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      {/* Featured Hero Banner */}
      {(trending.length > 0 || featured) && (
        <MobileHeroBanner items={trending.length > 0 ? trending : (featured ? [featured] : [])} />
      )}

      {/* Continue Watching Section */}
      {continueWatching.length > 0 && (
        <View style={styles.continueSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={18} color="#e50914" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Continue Watching</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.continueList}>
            {continueWatching.map((item) => (
              <ContinueWatchingCard
                key={item.mediaId}
                item={item}
                onRemove={(id) => setContinueWatching((prev) => prev.filter((p) => String(p.mediaId) !== String(id)))}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Top 10 Today Row with Netflix-style Giant Numbers */}
      {trending.length > 0 && <Top10MediaRow title="🏆 Top 10 Media Today" items={trending} />}

      {/* Media Rows */}
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
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  continueList: {
    gap: 12,
  },
});
