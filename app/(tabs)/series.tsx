import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';

import { MobileMediaGrid } from '../../components/MobileMediaGrid';
import { tmdbService } from '../../lib/tmdb';
import { MediaItem } from '../../types/media';

export default function SeriesScreen() {
  const [allSeries, setAllSeries] = useState<MediaItem[]>([]);
  const [asianDramas, setAsianDramas] = useState<MediaItem[]>([]);
  const [punjabiSeries, setPunjabiSeries] = useState<MediaItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageCount, setPageCount] = useState(5);

  useEffect(() => {
    // Load collections on initial mount
    tmdbService.getAsianDramas().then((dramas) => {
      setAsianDramas(dramas);
    });

    tmdbService.getPunjabiAndWebSeries().then((seriesList) => {
      setPunjabiSeries(seriesList);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (allSeries.length === 0) {
      setInitialLoading(true);
    } else {
      setLoadingMore(true);
    }

    tmdbService.getAllSeries(pageCount).then((data) => {
      if (!isMounted) return;

      // Ensure strict Latest to Oldest sorting
      const sorted = [...data].sort((a, b) => {
        const dateA = new Date(a.first_air_date || a.release_date || 0).getTime();
        const dateB = new Date(b.first_air_date || b.release_date || 0).getTime();
        return dateB - dateA;
      });

      setAllSeries(sorted);
      setInitialLoading(false);
      setLoadingMore(false);
    });

    return () => {
      isMounted = false;
    };
  }, [pageCount]);

  const handleLoadMore = () => {
    if (loadingMore) return;
    setPageCount((prev) => prev + 5);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>TV & Web Series Hub</Text>
        <Text style={styles.subtitle}>Explore curated collections and latest releases</Text>
      </View>

      {/* Featured Web Series Collections */}
      {asianDramas.length > 0 && (
        <MobileMediaGrid
          title="🌸 Top Asian & Chinese Dramas Collection"
          items={asianDramas}
          variant="carousel"
        />
      )}

      {punjabiSeries.length > 0 && (
        <MobileMediaGrid
          title="🎭 Punjabi & Trending Web Series"
          items={punjabiSeries}
          variant="carousel"
        />
      )}

      {/* All Series - Latest to Oldest Grid */}
      {initialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e50914" />
          <Text style={styles.loadingText}>Loading all series (Latest to Oldest)...</Text>
        </View>
      ) : (
        <View style={styles.gridSection}>
          <MobileMediaGrid
            title={`All Series • Latest to Oldest (${allSeries.length} shows)`}
            items={allSeries}
            variant="grid"
          />

          <TouchableOpacity
            onPress={handleLoadMore}
            disabled={loadingMore}
            style={[styles.loadMoreBtn, loadingMore && styles.loadMoreBtnDisabled]}
          >
            {loadingMore ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.loadMoreText}>Loading More Series...</Text>
              </View>
            ) : (
              <Text style={styles.loadMoreText}>Load More Series</Text>
            )}
          </TouchableOpacity>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    padding: 50,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  gridSection: {
    marginTop: 8,
    paddingBottom: 40,
  },
  loadMoreBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: '#1f1f2e',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadMoreBtnDisabled: {
    opacity: 0.7,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadMoreText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
