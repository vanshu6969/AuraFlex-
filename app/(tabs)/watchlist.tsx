import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { storageService, subscribeStorage } from '../../lib/storage';
import { MediaItem } from '../../types/media';

type FilterTab = 'all' | 'movies' | 'series';

export default function WatchlistScreen() {
  const [watchlist, setWatchlist] = useState<MediaItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const loadWatchlist = () => {
    storageService.getWatchlist().then(setWatchlist);
  };

  useEffect(() => {
    loadWatchlist();
    const unsubscribe = subscribeStorage(loadWatchlist);
    return () => unsubscribe();
  }, []);

  const handleRemoveItem = async (mediaId: number | string) => {
    await storageService.removeFromWatchlist(mediaId);
    loadWatchlist();
  };

  const handleClearAll = async () => {
    const confirmClear = () => {
      watchlist.forEach(async (item) => {
        await storageService.removeFromWatchlist(item.id);
      });
      setWatchlist([]);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to clear your entire watchlist?')) {
        confirmClear();
      }
    } else {
      Alert.alert(
        'Clear Watchlist',
        'Are you sure you want to remove all saved titles?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear All', style: 'destructive', onPress: confirmClear },
        ]
      );
    }
  };

  const filteredItems = watchlist.filter((item) => {
    if (activeFilter === 'movies') return item.media_type === 'movie';
    if (activeFilter === 'series') return item.media_type === 'tv' || item.media_type === 'anime';
    return true;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.titleGroup}>
          <View style={styles.iconCircle}>
            <Ionicons name="bookmark" size={20} color="#e50914" />
          </View>
          <View>
            <Text style={styles.heading}>Your Watchlist</Text>
            <Text style={styles.subheading}>Synced with Cloud & Device Storage</Text>
          </View>
        </View>

        {watchlist.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn} activeOpacity={0.75}>
            <Ionicons name="trash-outline" size={14} color="#ef4444" />
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs & Count Badge */}
      <View style={styles.filterRow}>
        <View style={styles.pillsContainer}>
          <TouchableOpacity
            onPress={() => setActiveFilter('all')}
            style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, activeFilter === 'all' && styles.filterPillTextActive]}>
              All ({watchlist.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter('movies')}
            style={[styles.filterPill, activeFilter === 'movies' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, activeFilter === 'movies' && styles.filterPillTextActive]}>
              Movies ({watchlist.filter((m) => m.media_type === 'movie').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter('series')}
            style={[styles.filterPill, activeFilter === 'series' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, activeFilter === 'series' && styles.filterPillTextActive]}>
              Series ({watchlist.filter((m) => m.media_type === 'tv' || m.media_type === 'anime').length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Watchlist Grid */}
      {filteredItems.length > 0 ? (
        <View style={styles.gridContainer}>
          {filteredItems.map((item) => (
            <View key={`${item.media_type}_${item.id}`} style={styles.cardWrapper}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => router.push(`/watch/${item.media_type}/${item.id}`)}
                style={styles.card}
              >
                <Image source={{ uri: item.poster_path || item.backdrop_path }} style={styles.posterImg} />


                {/* Rating & Quality Badges */}
                <View style={styles.badgeTopLeft}>
                  <Text style={styles.badgeRating}>⭐ {item.vote_average ? item.vote_average.toFixed(1) : '8.0'}</Text>
                </View>

                {/* Quick Delete X Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemoveItem(item.id);
                  }}
                  style={styles.deleteBtnTopRight}
                >
                  <Ionicons name="close" size={14} color="#ffffff" />
                </TouchableOpacity>

                {/* Bottom Gradient Overlay Info */}
                <View style={styles.cardGradientOverlay}>
                  <Text style={styles.cardGenreKicker} numberOfLines={1}>
                    {item.genres?.[0] || (item.media_type === 'movie' ? 'CINEMA' : 'SERIES')}
                  </Text>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="bookmark-outline" size={32} color="#e50914" />
          </View>
          <Text style={styles.emptyTitle}>
            {watchlist.length === 0 ? 'Your Watchlist is Empty' : 'No Titles Found in This Filter'}
          </Text>
          <Text style={styles.emptySubtitle}>
            Save your favorite movies, TV series, and anime by tapping "+ Watchlist" on any title.
          </Text>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.exploreBtn} activeOpacity={0.85}>
            <Ionicons name="compass-outline" size={16} color="#ffffff" />
            <Text style={styles.exploreBtnText}>Explore Trending Media</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c0f',
  },
  contentPadding: {
    paddingBottom: 90,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 14,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subheading: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  clearText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  filterRow: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillActive: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  filterPillText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  cardWrapper: {
    width: Platform.OS === 'web' ? ('calc(16.666% - 10px)' as any) : '48%',
    minWidth: 145,
  },

  card: {
    aspectRatio: 2 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#12141a',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  posterImg: {
    width: '100%',
    height: '100%',
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 5,
  },
  badgeRating: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
  },
  deleteBtnTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(11, 12, 15, 0.88)',
    zIndex: 5,
  },
  cardGenreKicker: {
    color: '#e50914',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#12141a',
    borderRadius: 20,
    padding: 32,
    marginHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 14,
  },
  emptySubtitle: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e50914',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 18,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
