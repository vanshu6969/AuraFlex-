import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MediaCard } from './MediaCard';
import { tmdbService } from '../lib/tmdb';
import { MediaItem } from '../types/media';

export interface RecentlyAddedProps {
  title?: string;
  items: MediaItem[];
  variant?: 'carousel' | 'grid';
  onExplorePress?: () => void;
}

export const RecentlyAdded: React.FC<RecentlyAddedProps> = ({
  title = 'Recently Added',
  items: initialItems,
  variant = 'grid',
  onExplorePress,
}) => {
  const [itemList, setItemList] = useState<MediaItem[]>(initialItems || []);
  const [page, setPage] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const isFetchingRef = useRef<boolean>(false);

  // 1. Pre-fetch initial batch (pages 1 to 4) automatically on mount
  useEffect(() => {
    let isMounted = true;
    const loadInitialBatch = async () => {
      try {
        const [p1, p2, p3, p4] = await Promise.all([
          tmdbService.getRecentlyAdded(1),
          tmdbService.getRecentlyAdded(2),
          tmdbService.getRecentlyAdded(3),
          tmdbService.getRecentlyAdded(4),
        ]);
        if (!isMounted) return;

        const combined = [...(initialItems || []), ...p1, ...p2, ...p3, ...p4];
        const seen = new Set();
        const unique = combined.filter((i) => {
          const key = `${i.media_type}_${i.id}_${i.season || 0}_${i.episode || 0}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setItemList(unique);
        setPage(4);
      } catch (e) {
        console.error('[RecentlyAdded] Pre-fetch batch error:', e);
      }
    };

    loadInitialBatch();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load next page dynamically
  const loadNextPage = async () => {
    if (isFetchingRef.current || loadingMore || !hasMore) return;
    isFetchingRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const nextItems = await tmdbService.getRecentlyAdded(nextPage);
      if (!nextItems || nextItems.length === 0) {
        setHasMore(false);
      } else {
        setItemList((prev) => {
          const seen = new Set(prev.map((i) => `${i.media_type}_${i.id}_${i.season || 0}_${i.episode || 0}`));
          const unique = nextItems.filter((i) => !seen.has(`${i.media_type}_${i.id}_${i.season || 0}_${i.episode || 0}`));
          if (unique.length === 0) setHasMore(false);
          return [...prev, ...unique];
        });
        setPage(nextPage);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  // 3. Automatic Infinite Scroll Listener for Web
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleWindowScroll = () => {
      if (isFetchingRef.current || !hasMore) return;
      const scrollPosition = window.innerHeight + window.scrollY;
      const scrollThreshold = document.documentElement.scrollHeight - 700;

      if (scrollPosition >= scrollThreshold) {
        loadNextPage();
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [page, hasMore]);

  if (!itemList || itemList.length === 0) return null;

  const handleExplore = () => {
    if (onExplorePress) {
      onExplorePress();
    } else {
      router.push('/series');
    }
  };

  return (
    <View style={styles.sectionContainer}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.redIndicator} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <TouchableOpacity style={styles.exploreBtn} onPress={handleExplore} activeOpacity={0.7}>
          <Text style={styles.exploreText}>View All</Text>
          <Ionicons name="chevron-forward" size={14} color="#e50914" />
        </TouchableOpacity>
      </View>

      {/* Media Grid or Carousel */}
      {variant === 'carousel' ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={itemList}
          keyExtractor={(item, index) => `${item.media_type}-${item.id}-${item.season || 0}-${item.episode || 0}-${index}`}
          renderItem={({ item }) => <MediaCard item={item} width={155} />}
          contentContainerStyle={styles.carouselContent}
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.5}
        />
      ) : (
        <View>
          <View
            style={[
              styles.gridContainer,
              Platform.OS === 'web' && ({
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 16,
              } as any),
            ]}
          >
            {itemList.map((item, index) => (
              <View
                key={`${item.media_type}-${item.id}-${item.season || 0}-${item.episode || 0}-${index}`}
                style={styles.gridWrapper}
              >
                <MediaCard item={item} width="100%" />
              </View>
            ))}
          </View>

          {/* Automatic Infinite Scroll Loading Indicator */}
          <View style={styles.loadMoreBox}>
            {loadingMore ? (
              <View style={styles.loadingMoreInner}>
                <ActivityIndicator size="small" color="#e50914" />
                <Text style={styles.loadingMoreText}>Auto-loading recently added releases (Page {page + 1})...</Text>
              </View>
            ) : hasMore ? (
              <TouchableOpacity onPress={loadNextPage} style={styles.loadMoreBtn} activeOpacity={0.8}>
                <Ionicons name="sparkles" size={14} color="#e50914" />
                <Text style={styles.loadMoreBtnText}>Auto-Loading Feed (Page {page})</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.endText}>You have viewed all recently added releases.</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginVertical: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redIndicator: {
    width: 3.5,
    height: 17,
    borderRadius: 2,
    backgroundColor: '#e50914',
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
  },
  countBadgeText: {
    color: '#e50914',
    fontSize: 11,
    fontWeight: '700',
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingLeft: 8,
  },
  exploreText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  carouselContent: {
    paddingLeft: 16,
    paddingRight: 6,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
    gap: 14,
  },
  gridWrapper: {
    width: Platform.OS === 'web' ? '100%' : 150,
    marginBottom: 14,
  },
  loadMoreBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingMoreText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  loadMoreBtnText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  endText: {
    color: '#6b7280',
    fontSize: 12,
  },
});
