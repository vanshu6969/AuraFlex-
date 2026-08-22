import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MediaSection } from '../../components/MediaSection';
import { SkeletonGrid } from '../../components/SkeletonGrid';
import { tmdbService } from '../../lib/tmdb';

import { MediaItem } from '../../types/media';

type MediaTypeFilter = 'all' | 'movie' | 'tv';

const CATEGORY_NAMES: Record<string, string> = {
  marvel: 'Marvel Universe',
  dc: 'DC Universe',
  anime: 'Anime Universe',
  kdrama: 'K-Drama World',
  cdrama: 'C-Drama & Wuxia',
  punjabi: 'Punjabi Cinema',
  bollywood: 'Bollywood Hits',
  'hollywood-series': 'Hollywood Sagas & Sitcoms',
  'indian-series': 'Indian & Desi Web Series',
  action: 'Action & Adventure',
  comedy: 'Comedy & Sitcoms',
  horror: 'Horror & Paranormal',
};

const CATEGORY_BANNERS: Record<string, { banner: string; subtitle: string; accentColor: string }> = {
  marvel: {
    banner: 'https://image.tmdb.org/t/p/w780/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
    subtitle: 'MCU blockbusters, epic superhero sagas & Disney+ series',
    accentColor: '#e50914',
  },
  dc: {
    banner: 'https://image.tmdb.org/t/p/w780/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg',
    subtitle: 'Gotham City legends, Justice League & dark knight thrillers',
    accentColor: '#3b82f6',
  },
  anime: {
    banner: 'https://image.tmdb.org/t/p/w780/nTvM4mhqZlHIkw29X8AJivv62DC.jpg',
    subtitle: 'Japanese animation series, shonen sagas & dark fantasy',
    accentColor: '#8b5cf6',
  },
  kdrama: {
    banner: 'https://image.tmdb.org/t/p/w780/2meX1nMdScFOoV4370rqHWFDxSu.jpg',
    subtitle: 'Korean romantic, mystery, & high-stakes thriller series',
    accentColor: '#10b981',
  },
  cdrama: {
    banner: 'https://image.tmdb.org/t/p/w780/9yBVqNruk6Skr6v8WVz84v0h5F4.jpg',
    subtitle: 'Chinese historical epics, Wuxia martial arts & palace dramas',
    accentColor: '#f59e0b',
  },
  punjabi: {
    banner: 'https://image.tmdb.org/t/p/w780/a90j80eL300P6b8k43yT1Q7dE6A.jpg',
    subtitle: 'Punjabi hit comedy cinema, family series & regional hits',
    accentColor: '#ec4899',
  },
  'hollywood-series': {
    banner: 'https://image.tmdb.org/t/p/w780/mYLoexL50858e38r08fR37q5LzH.jpg',
    subtitle: 'Iconic sitcoms, HBO dramas, & binge-worthy English series',
    accentColor: '#f59e0b',
  },
  'indian-series': {
    banner: 'https://image.tmdb.org/t/p/w780/5v5oJ7vQd49Z6Fm89K09Zk3.jpg',
    subtitle: 'Panchayat, Mirzapur, The Family Man & top Indian web thrillers',
    accentColor: '#10b981',
  },
  bollywood: {
    banner: 'https://image.tmdb.org/t/p/w780/x2IqsMlpbOhS8zIisSux4yq4iTq.jpg',
    subtitle: 'Hindi blockbusters, action thrillers & box office cinema',
    accentColor: '#a855f7',
  },
  action: {
    banner: 'https://image.tmdb.org/t/p/w780/7I6VUdPj6tQECNHdviJkUHD2389.jpg',
    subtitle: 'High-octane action blockbusters & pulse-pounding adventures',
    accentColor: '#ef4444',
  },
  comedy: {
    banner: 'https://image.tmdb.org/t/p/w780/gL206hXvyoE9i5B67eQ1M665eS2.jpg',
    subtitle: 'Hilarious comedy movies, standup specials & sitcom hits',
    accentColor: '#06b6d4',
  },
  horror: {
    banner: 'https://image.tmdb.org/t/p/w780/r2J02Z2OpNTctfOSN1YwsiYsXI2.jpg',
    subtitle: 'Supernatural chillers, slasher hits & psychological horror',
    accentColor: '#64748b',
  },
};


type SortMode = 'release_asc' | 'watch_order' | 'popularity' | 'release_desc';

export default function CategoryExplorePage() {
  const params = useLocalSearchParams<{ category: string }>();
  const categoryId = (params.category || 'marvel').toLowerCase();
  const categoryName = CATEGORY_NAMES[categoryId] || 'Explore Collection';
  const categoryConfig = CATEGORY_BANNERS[categoryId] || {
    banner: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
    subtitle: 'Curated entertainment collection',
    accentColor: '#e50914',
  };

  const isUniverseCategory = categoryId === 'marvel' || categoryId === 'dc';

  const [bannerUri, setBannerUri] = useState(categoryConfig.banner);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>(isUniverseCategory ? 'release_asc' : 'popularity');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setBannerUri(categoryConfig.banner);
  }, [categoryId]);

  // Load initial page 1 on category or sort mode change
  useEffect(() => {
    setLoading(true);
    setPage(1);
    setHasMore(true);

    tmdbService
      .getCategoryItems(categoryId, 1, sortMode)
      .then((data) => {
        setItems(data);
        if (data.length === 0) setHasMore(false);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [categoryId, sortMode]);

  // Load next page
  const loadNextPage = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;

    tmdbService
      .getCategoryItems(categoryId, nextPage, sortMode)
      .then((data) => {
        if (data.length === 0) {
          setHasMore(false);
        } else {
          setItems((prev) => {
            const seen = new Set(prev.map((i) => `${i.media_type}_${i.id}`));
            const unique = data.filter((i) => !seen.has(`${i.media_type}_${i.id}`));
            return [...prev, ...unique];
          });
          setPage(nextPage);
        }
      })
      .finally(() => setLoadingMore(false));
  };

  // Scroll trigger for infinite scroll
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 300;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      loadNextPage();
    }
  };

  const filteredItems = items.filter((item) => {
    if (mediaTypeFilter === 'movie') return item.media_type === 'movie';
    if (mediaTypeFilter === 'tv') return item.media_type === 'tv' || item.media_type === 'anime';
    return true;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentPadding}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={200}
    >
      {/* Category Hero Banner Header */}
      <View style={styles.heroBannerBox}>
        <Image
          source={{ uri: bannerUri }}
          onError={() =>
            setBannerUri(
              'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80'
            )
          }
          style={styles.heroBannerImage}
          resizeMode="cover"
        />

        {/* Gradient Backdrop Overlay */}
        <View style={styles.heroGradientOverlay} />

        {/* Back Button Floating Top Left */}
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/series');
            }
          }}
          style={styles.floatingBackBtn}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={18} color="#ffffff" />
          <Text style={styles.floatingBackText}>Explore Hub</Text>
        </TouchableOpacity>

        {/* Hero Content */}
        <View style={styles.heroContent}>
          <View style={[styles.heroAccentPill, { backgroundColor: categoryConfig.accentColor }]} />
          <Text style={styles.heroTitle}>{categoryName}</Text>
          <Text style={styles.heroSub}>{categoryConfig.subtitle}</Text>
          <Text style={styles.heroMetaText}>Infinite Collection</Text>
        </View>
      </View>

      {/* Interactive Sorting & Type Filter Controls Bar */}
      <View style={styles.controlsContainer}>
        {/* Sort Mode Segmented Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortPillsRow}>
          <TouchableOpacity
            onPress={() => setSortMode('release_asc')}
            style={[styles.sortPill, sortMode === 'release_asc' && styles.sortPillActive]}
          >
            <Text style={[styles.sortPillText, sortMode === 'release_asc' && styles.sortPillTextActive]}>
              📅 Release Year (Oldest)
            </Text>
          </TouchableOpacity>

          {isUniverseCategory && (
            <TouchableOpacity
              onPress={() => setSortMode('watch_order')}
              style={[styles.sortPill, sortMode === 'watch_order' && styles.sortPillActive]}
            >
              <Text style={[styles.sortPillText, sortMode === 'watch_order' && styles.sortPillTextActive]}>
                🎬 Watch Order (Timeline)
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setSortMode('release_desc')}
            style={[styles.sortPill, sortMode === 'release_desc' && styles.sortPillActive]}
          >
            <Text style={[styles.sortPillText, sortMode === 'release_desc' && styles.sortPillTextActive]}>
              🗓️ Newest First
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSortMode('popularity')}
            style={[styles.sortPill, sortMode === 'popularity' && styles.sortPillActive]}
          >
            <Text style={[styles.sortPillText, sortMode === 'popularity' && styles.sortPillTextActive]}>
              🔥 Popularity
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Type Filter Tabs (All / Movies / Series) */}
        <View style={styles.typeTabsRow}>
          <TouchableOpacity
            onPress={() => setMediaTypeFilter('all')}
            style={[styles.typeTab, mediaTypeFilter === 'all' && styles.typeTabActive]}
          >
            <Text style={[styles.typeTabText, mediaTypeFilter === 'all' && styles.typeTabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMediaTypeFilter('movie')}
            style={[styles.typeTab, mediaTypeFilter === 'movie' && styles.typeTabActive]}
          >
            <Text style={[styles.typeTabText, mediaTypeFilter === 'movie' && styles.typeTabTextActive]}>
              Movies
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMediaTypeFilter('tv')}
            style={[styles.typeTab, mediaTypeFilter === 'tv' && styles.typeTabActive]}
          >
            <Text style={[styles.typeTabText, mediaTypeFilter === 'tv' && styles.typeTabTextActive]}>
              Series
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Media Grid */}
      {loading ? (
        <SkeletonGrid count={12} />
      ) : filteredItems.length > 0 ? (
        <View>
          <MediaSection
            title={categoryName}
            items={filteredItems}
            variant="grid"
          />

          {/* Infinite Scroll Load More Footer */}
          <View style={styles.loadMoreBox}>
            {loadingMore ? (
              <View style={styles.loadingMoreInner}>
                <ActivityIndicator size="small" color="#e50914" />
                <Text style={styles.loadingMoreText}>Fetching more {categoryName} titles...</Text>
              </View>
            ) : hasMore ? (
              <TouchableOpacity onPress={loadNextPage} style={styles.loadMoreBtn} activeOpacity={0.8}>
                <Text style={styles.loadMoreBtnText}>Load More Titles (Page {page + 1})</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.endText}>You have reached the end of this collection.</Text>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="film-outline" size={36} color="#6b7280" />
          <Text style={styles.emptyTitle}>No Titles Found in This Filter</Text>
          <TouchableOpacity onPress={() => setMediaTypeFilter('all')} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>Show All Titles</Text>
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
  heroBannerBox: {
    width: '100%',
    height: Platform.OS === 'web' ? 240 : 200,
    position: 'relative',
    backgroundColor: '#181924',
    marginBottom: 16,
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 12, 15, 0.72)',
  },
  floatingBackBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
  },
  floatingBackText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  heroContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  heroAccentPill: {
    width: 28,
    height: 4,
    borderRadius: 2,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  heroSub: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  heroMetaText: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 6,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
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
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 13,
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
  },
  loadMoreBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  loadMoreBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  endText: {
    color: '#6b7280',
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: '#12141a',
    borderRadius: 18,
    padding: 32,
    marginHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 10,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  resetBtn: {
    backgroundColor: '#e50914',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 14,
  },
  resetBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  controlsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  sortPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  sortPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sortPillActive: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  sortPillText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  sortPillTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  typeTabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  typeTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  typeTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  typeTabText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  typeTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
