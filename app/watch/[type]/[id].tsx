import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MobilePlayer } from '../../../components/MobilePlayer';
import { MobileMediaGrid } from '../../../components/MobileMediaGrid';
import { MOCK_MEDIA_ITEMS } from '../../../lib/mediaData';
import { tmdbService } from '../../../lib/tmdb';
import { MediaItem } from '../../../types/media';


export default function WatchScreen() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const mediaType: 'movie' | 'tv' = type === 'tv' ? 'tv' : 'movie';
  const mediaId = id || '550';

  const [activeMedia, setActiveMedia] = useState<MediaItem>(() => {
    const found = MOCK_MEDIA_ITEMS.find((m) => String(m.id) === String(mediaId));
    return (
      found || {
        id: mediaId,
        title: mediaType === 'tv' ? 'Featured TV Series' : 'Featured Movie',
        overview: 'Stream top-quality cinema media across multi-server fallback embed providers.',
        poster_path: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
        backdrop_path: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80',
        media_type: mediaType,
        vote_average: 8.5,
        genres: ['Action', 'Drama', 'Sci-Fi'],
        quality: '4K Ultra HD',
      }
    );
  });

  const [recommended, setRecommended] = useState<MediaItem[]>(MOCK_MEDIA_ITEMS);

  useEffect(() => {
    tmdbService.getMediaDetails(mediaId, mediaType).then((item) => {
      if (item) setActiveMedia(item);
    });

    tmdbService.getTrending().then((trending) => {
      setRecommended(trending.filter((m) => String(m.id) !== String(mediaId)));
    });
  }, [mediaId, mediaType]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Back Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>


      {/* Embedded Fullscreen Video Player with Multi-Server Switcher */}
      <MobilePlayer media={activeMedia} />

      {/* Recommended Titles Carousel */}
      <MobileMediaGrid title="🔥 Recommended For You" items={recommended} variant="carousel" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f12',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
