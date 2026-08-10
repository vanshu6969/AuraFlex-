import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import { MobileSearchFilter } from '../../components/MobileSearchFilter';
import { MobileMediaGrid } from '../../components/MobileMediaGrid';
import { MOCK_MEDIA_ITEMS } from '../../lib/mediaData';
import { tmdbService } from '../../lib/tmdb';
import { MediaItem } from '../../types/media';


import { fetchTrendingAnime, searchAnime, mapAniListToMediaItem } from '../../lib/anilist';

export default function SearchScreen() {
  const [results, setResults] = useState<MediaItem[]>(MOCK_MEDIA_ITEMS);

  const handleSearch = async (query: string, category: string, selectedGenre: string) => {
    let list: MediaItem[] = [];

    if (query.trim()) {
      if (category === 'anime') {
        const aniList = await searchAnime(query);
        list = aniList.map(mapAniListToMediaItem);
      } else {
        list = await tmdbService.searchMedia(query, category);
      }
    } else {
      if (category === 'anime') {
        const aniList = await fetchTrendingAnime();
        list = aniList.map(mapAniListToMediaItem);
      } else if (category === 'movie') {
        list = await tmdbService.getPopularMovies();
      } else if (category === 'tv') {
        list = await tmdbService.getTopTVShows();
      } else {
        list = await tmdbService.getTrending();
      }
    }

    if (category === 'animation') {
      list = list.filter((item) => item.genres.includes('Animation'));
    }

    if (selectedGenre && selectedGenre !== 'All') {
      list = list.filter((item) => item.genres && item.genres.includes(selectedGenre));
    }

    setResults(list);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <MobileSearchFilter onSearch={handleSearch} />

      <MobileMediaGrid title={`Results (${results.length})`} items={results} variant="grid" />

      {results.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Media Found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your search terms or genre filter pills.</Text>
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 20,
    backgroundColor: '#18181f',
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyTitle: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
