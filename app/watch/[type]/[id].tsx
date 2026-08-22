import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MobilePlayer } from '../../../components/MobilePlayer';
import { MobileMediaGrid } from '../../../components/MobileMediaGrid';
import { MOCK_MEDIA_ITEMS } from '../../../lib/mediaData';
import { tmdbService } from '../../../lib/tmdb';
import { getAnimeDetails } from '../../../lib/anilist';
import { streamOverrideService } from '../../../lib/streamOverrides';
import { StructuredData } from '../../../components/StructuredData';
import { MediaItem } from '../../../types/media';



export default function WatchScreen() {
  const { type, id, season: seasonQuery, episode: episodeQuery } = useLocalSearchParams<{
    type: string;
    id: string;
    season?: string;
    episode?: string;
  }>();

  const rawType = (type as string) || 'movie';
  const mediaType: 'movie' | 'tv' | 'anime' = rawType === 'anime' ? 'anime' : rawType === 'tv' ? 'tv' : 'movie';
  const mediaId = id || '550';
  const parsedSeason = seasonQuery ? parseInt(String(seasonQuery), 10) : undefined;
  const parsedEpisode = episodeQuery ? parseInt(String(episodeQuery), 10) : undefined;

  const [activeMedia, setActiveMedia] = useState<MediaItem>(() => {
    const found = MOCK_MEDIA_ITEMS.find((m) => String(m.id) === String(mediaId));
    return (
      found || {
        id: mediaId,
        title: mediaType === 'anime' ? 'Featured Anime' : mediaType === 'tv' ? 'Featured TV Series' : 'Featured Movie',
        overview: 'Stream top-quality media across multi-server fallback embed providers.',
        poster_path: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
        backdrop_path: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80',
        media_type: mediaType,
        vote_average: 8.5,
        genres: ['Action', 'Drama', 'Sci-Fi'],
        quality: '1080p Full HD',
        episodes_count: 12,
      }
    );
  });

  const [recommended, setRecommended] = useState<MediaItem[]>(MOCK_MEDIA_ITEMS);

  useEffect(() => {
    const fetchMetadata = async () => {
      // 1. Immediately check Supabase stream override database (Independent of AniList / TMDB)
      try {
        const override = await streamOverrideService.getOverride(mediaId);
        if (override) {
          setActiveMedia((prev) => ({
            ...prev,
            id: String(mediaId),
            title: override.title || prev.title,
            media_type: override.media_type || mediaType,
          }));
        }
      } catch (e) {}

      // 2. Fetch external details conditionally without blocking player stream
      try {
        if (mediaType === 'anime') {
          const animeData = await getAnimeDetails(mediaId);
          if (animeData) {
            setActiveMedia((prev) => ({
              ...prev,
              id: animeData.id,
              title: animeData.title.english || animeData.title.romaji || prev.title || 'Featured Anime',
              overview: animeData.description ? animeData.description.replace(/<[^>]*>?/gm, '') : prev.overview,
              poster_path: animeData.coverImage.extraLarge || animeData.coverImage.large || prev.poster_path,
              backdrop_path: animeData.bannerImage || animeData.coverImage.extraLarge || prev.backdrop_path,
              media_type: 'anime',
              vote_average: animeData.averageScore ? animeData.averageScore / 10 : prev.vote_average,
              genres: animeData.genres?.length ? animeData.genres : prev.genres,
              quality: '1080p Full HD',
              episodes_count: animeData.episodes || prev.episodes_count,
            }));
          }
        } else {
          const tmdbItem = await tmdbService.getMediaDetails(mediaId, mediaType);
          if (tmdbItem) {
            setActiveMedia({
              ...tmdbItem,
              season: parsedSeason || tmdbItem.season,
              episode: parsedEpisode || tmdbItem.episode,
            });
          }
        }
      } catch (e) {
        console.error('Metadata fetch error:', e);
      }
    };

    fetchMetadata();

    tmdbService.getTrending().then((trending) => {
      setRecommended(trending.filter((m) => String(m.id) !== String(mediaId)));
    });
  }, [mediaId, mediaType, parsedSeason, parsedEpisode]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Programmatic High-Demand SEO Metadata & Schema.org Structured Data */}
      <StructuredData
        type={activeMedia.media_type === 'tv' ? 'tv' : activeMedia.media_type === 'anime' ? 'anime' : 'movie'}
        title={activeMedia.title}
        description={activeMedia.overview || `Stream ${activeMedia.title} free in HD on AuraFlex Movies.`}
        image={activeMedia.poster_path}
        url={`https://auraflexmovies.vercel.app/watch/${activeMedia.media_type || 'movie'}/${activeMedia.id}`}
        year={activeMedia.year || (activeMedia.release_date ? activeMedia.release_date.split('-')[0] : activeMedia.first_air_date ? activeMedia.first_air_date.split('-')[0] : '2026')}
        season={parsedSeason || activeMedia.season}
        episode={parsedEpisode || activeMedia.episode}
        genres={activeMedia.genres}
        quality={activeMedia.quality || '1080p Full HD'}
        directUrl={`https://auraflexmovies.vercel.app/api/streamtape?file=${activeMedia.id}`}
      />

      {/* Top Back Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>


      {/* Embedded Fullscreen Video Player with Multi-Server Switcher */}
      <MobilePlayer
        media={activeMedia}
        season={parsedSeason || activeMedia.season || 1}
        episode={parsedEpisode || activeMedia.episode || 1}
      />

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
