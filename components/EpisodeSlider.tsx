import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tmdbService } from '../lib/tmdb';

export interface EpisodeItem {
  episode_number: number;
  name: string;
  overview?: string;
  still_path?: string;
  runtime?: number;
}

export interface EpisodeSliderProps {
  tmdbId: string | number;
  currentSeason: number;
  currentEpisode: number;
  onSelectEpisode: (season: number, episode: number) => void;
}

export const EpisodeSlider: React.FC<EpisodeSliderProps> = ({
  tmdbId,
  currentSeason,
  currentEpisode,
  onSelectEpisode,
}) => {
  const [selectedSeason, setSelectedSeason] = useState(currentSeason);
  const [seasons, setSeasons] = useState<Array<{ season_number: number; episode_count: number; name: string }>>([
    { season_number: 1, episode_count: 10, name: 'Season 1' },
  ]);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);

  // Fetch show seasons on mount
  useEffect(() => {
    if (!tmdbId) return;

    tmdbService.getTVShowDetails(tmdbId).then((details) => {
      if (details?.seasons && Array.isArray(details.seasons)) {
        const validSeasons = details.seasons.filter((s: any) => s.season_number > 0);
        if (validSeasons.length > 0) {
          setSeasons(validSeasons);
        }
      }
    });
  }, [tmdbId]);

  // Fetch season episodes when season changes
  useEffect(() => {
    if (!tmdbId) return;

    setLoading(true);
    tmdbService
      .getTVSeasonDetails(tmdbId, selectedSeason)
      .then((seasonData) => {
        if (seasonData?.episodes && Array.isArray(seasonData.episodes)) {
          setEpisodes(seasonData.episodes);
        } else {
          // Fallback generate episodes list
          const count = seasons.find((s) => s.season_number === selectedSeason)?.episode_count || 10;
          setEpisodes(
            Array.from({ length: count }).map((_, i) => ({
              episode_number: i + 1,
              name: `Episode ${i + 1}`,
            }))
          );
        }
      })
      .catch(() => {
        setEpisodes(
          Array.from({ length: 10 }).map((_, i) => ({
            episode_number: i + 1,
            name: `Episode ${i + 1}`,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [tmdbId, selectedSeason]);

  const currentSeasonName = seasons.find((s) => s.season_number === selectedSeason)?.name || `Season ${selectedSeason}`;

  return (
    <View style={styles.container}>
      {/* Header Bar with Season Selector Dropdown */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Episodes & Seasons</Text>
          <Text style={styles.headerSub}>Select season & episode to play</Text>
        </View>

        {/* Season Dropdown */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
            style={styles.dropdownBtn}
          >
            <Text style={styles.dropdownBtnText}>{currentSeasonName}</Text>
            <Ionicons name={seasonDropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#ffffff" />
          </TouchableOpacity>

          {seasonDropdownOpen && (
            <View style={styles.dropdownMenu}>
              <ScrollView style={{ maxHeight: 180 }}>
                {seasons.map((season) => {
                  const isSelected = season.season_number === selectedSeason;
                  return (
                    <TouchableOpacity
                      key={season.season_number}
                      onPress={() => {
                        setSelectedSeason(season.season_number);
                        setSeasonDropdownOpen(false);
                      }}
                      style={[styles.menuItem, isSelected && styles.menuItemActive]}
                    >
                      <Text style={[styles.menuText, isSelected && styles.menuTextActive]}>
                        {season.name || `Season ${season.season_number}`} ({season.episode_count || 10} eps)
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Horizontal Episode Cards Slider */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#e50914" />
          <Text style={styles.loadingText}>Loading {currentSeasonName} episodes...</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScrollPadding}>
          {episodes.map((ep) => {
            const isPlaying = selectedSeason === currentSeason && ep.episode_number === currentEpisode;
            const thumbnailUri = ep.still_path
              ? `https://image.tmdb.org/t/p/w500${ep.still_path}`
              : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80';

            return (
              <TouchableOpacity
                key={ep.episode_number}
                activeOpacity={0.88}
                onPress={() => onSelectEpisode(selectedSeason, ep.episode_number)}
                style={[styles.episodeCard, isPlaying && styles.episodeCardPlaying]}
              >
                {/* Thumbnail Image Box */}
                <View style={styles.thumbnailBox}>
                  <Image source={{ uri: thumbnailUri }} style={styles.thumbnailImg} resizeMode="cover" />

                  {/* Playing Pulse Badge or Episode Badge */}
                  {isPlaying ? (
                    <View style={styles.nowPlayingBadge}>
                      <Ionicons name="play" size={12} color="#ffffff" />
                      <Text style={styles.nowPlayingText}>PLAYING</Text>
                    </View>
                  ) : (
                    <View style={styles.epPill}>
                      <Text style={styles.epPillText}>
                        E{ep.episode_number < 10 ? `0${ep.episode_number}` : ep.episode_number}
                      </Text>
                    </View>
                  )}

                  {/* Runtime Badge */}
                  {ep.runtime ? (
                    <View style={styles.runtimePill}>
                      <Text style={styles.runtimeText}>{ep.runtime}m</Text>
                    </View>
                  ) : null}
                </View>

                {/* Info Text */}
                <View style={styles.cardInfo}>
                  <Text style={styles.epTitle} numberOfLines={1}>
                    {ep.episode_number}. {ep.name || `Episode ${ep.episode_number}`}
                  </Text>
                  <Text style={styles.epOverview} numberOfLines={2}>
                    {ep.overview || 'Tap to play this episode'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
    zIndex: 20,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSub: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 30,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181924',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  dropdownBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 42,
    right: 0,
    width: 170,
    backgroundColor: '#14151f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 4,
    zIndex: 50,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  menuItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: '#e50914',
  },
  menuText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  menuTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  cardsScrollPadding: {
    paddingHorizontal: 16,
    gap: 12,
  },
  episodeCard: {
    width: 220,
    backgroundColor: '#12141a',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  episodeCardPlaying: {
    borderColor: '#e50914',
    borderWidth: 2,
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  thumbnailBox: {
    width: '100%',
    height: 124,
    position: 'relative',
    backgroundColor: '#181924',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  nowPlayingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e50914',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nowPlayingText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  epPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  epPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  runtimePill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  runtimeText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '600',
  },
  cardInfo: {
    padding: 10,
  },
  epTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  epOverview: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
});
