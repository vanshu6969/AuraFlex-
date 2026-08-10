import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';

import { MobileMediaGrid } from '../../components/MobileMediaGrid';
import { tmdbService } from '../../lib/tmdb';
import { MediaItem } from '../../types/media';

export default function SeriesScreen() {
  const [series, setSeries] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tmdbService.getTopTVShows().then((data) => {
      setSeries(data);
      setLoading(false);
    });
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>TV & Web Series</Text>
        <Text style={styles.subtitle}>Explore top-rated shows and binge-worthy web series</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e50914" />
        </View>
      ) : (
        <MobileMediaGrid title={`Top Series (${series.length})`} items={series} variant="grid" />
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
    paddingBottom: 8,
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
    padding: 40,
    alignItems: 'center',
  },
});
