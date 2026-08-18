import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { tmdbService } from '../lib/tmdb';

export type CategoryKey =
  | 'all'
  | 'marvel'
  | 'dc'
  | 'anime'
  | 'kdrama'
  | 'cdrama'
  | 'punjabi'
  | 'bollywood'
  | 'hollywood-series'
  | 'indian-series'
  | 'action'
  | 'comedy'
  | 'horror';

export interface CategoryHubTile {
  id: CategoryKey;
  title: string;
  subtitle: string;
  accentColor: string;
  bgPoster: string;
}

export const CATEGORY_TILES: CategoryHubTile[] = [
  {
    id: 'marvel',
    title: 'Marvel Universe',
    subtitle: 'MCU movies, sagas & series',
    accentColor: '#e50914',
    bgPoster: 'https://image.tmdb.org/t/p/w780/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
  },
  {
    id: 'dc',
    title: 'DC Universe',
    subtitle: 'Gotham, Justice League & Batman',
    accentColor: '#3b82f6',
    bgPoster: 'https://image.tmdb.org/t/p/w780/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg',
  },
  {
    id: 'anime',
    title: 'Anime Universe',
    subtitle: 'Japanese animation sagas',
    accentColor: '#8b5cf6',
    bgPoster: 'https://image.tmdb.org/t/p/w780/nTvM4mhqZlHIkw29X8AJivv62DC.jpg',
  },
  {
    id: 'kdrama',
    title: 'K-Drama World',
    subtitle: 'Korean romantic & thriller series',
    accentColor: '#10b981',
    bgPoster: 'https://image.tmdb.org/t/p/w780/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
  },
  {
    id: 'cdrama',
    title: 'C-Drama & Wuxia',
    subtitle: 'Chinese historical & fantasy sagas',
    accentColor: '#f59e0b',
    bgPoster: 'https://image.tmdb.org/t/p/w780/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg',
  },
  {
    id: 'punjabi',
    title: 'Punjabi Cinema',
    subtitle: 'Hit comedy, drama & web hits',
    accentColor: '#ec4899',
    bgPoster: 'https://image.tmdb.org/t/p/w780/x2IqsMlpbOhS8zIisSux4yq4iTq.jpg',
  },
  {
    id: 'hollywood-series',
    title: 'Hollywood Sagas & Sitcoms',
    subtitle: 'Friends, Breaking Bad & Binge Series',
    accentColor: '#f59e0b',
    bgPoster: 'https://image.tmdb.org/t/p/w780/mYLoexL50858e38r08fR37q5LzH.jpg',
  },
  {
    id: 'indian-series',
    title: 'Indian & Desi Web Series',
    subtitle: 'Panchayat, The Family Man, Mirzapur & Thrillers',
    accentColor: '#10b981',
    bgPoster: 'https://image.tmdb.org/t/p/w780/x2IqsMlpbOhS8zIisSux4yq4iTq.jpg',
  },
  {
    id: 'bollywood',
    title: 'Bollywood Hits',
    subtitle: 'Hindi blockbusters & web sagas',
    accentColor: '#a855f7',
    bgPoster: 'https://image.tmdb.org/t/p/w780/x2IqsMlpbOhS8zIisSux4yq4iTq.jpg',
  },
  {
    id: 'action',
    title: 'Action & Adventure',
    subtitle: 'High-octane blockbusters',
    accentColor: '#ef4444',
    bgPoster: 'https://image.tmdb.org/t/p/w780/7I6VUdPj6tQECNHdviJkUHD2389.jpg',
  },
  {
    id: 'comedy',
    title: 'Comedy & Sitcoms',
    subtitle: 'Binge-worthy sitcom hits',
    accentColor: '#06b6d4',
    bgPoster: 'https://image.tmdb.org/t/p/w780/gL206hXvyoE9i5B67eQ1M665eS2.jpg',
  },
  {
    id: 'horror',
    title: 'Horror & Paranormal',
    subtitle: 'Terrifying thrillers & chillers',
    accentColor: '#64748b',
    bgPoster: 'https://image.tmdb.org/t/p/w780/r2J02Z2OpNTctfOSN1YwsiYsXI2.jpg',
  },
];

interface TileCardItemProps {
  tile: CategoryHubTile;
  isSelected: boolean;
  onSelect: () => void;
}

const FALLBACK_BACKDROP = 'https://image.tmdb.org/t/p/w780/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg';

const TileCardItem: React.FC<TileCardItemProps> = ({ tile, isSelected, onSelect }) => {
  const [imgSrc, setImgSrc] = useState(tile.bgPoster);

  useEffect(() => {
    let isMounted = true;
    tmdbService
      .getCategoryItems(tile.id, 1)
      .then((items) => {
        if (isMounted && items && items.length > 0) {
          const topBackdrop = items[0].backdrop_path || items[0].poster_path || items[1]?.backdrop_path;
          if (topBackdrop) {
            setImgSrc(topBackdrop);
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [tile.id]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onSelect}
      style={styles.tileCard}
    >
      {/* Live TMDB Backdrop Image */}
      <Image
        source={{ uri: imgSrc }}
        onError={() => setImgSrc(FALLBACK_BACKDROP)}
        style={styles.bgImage}
        resizeMode="cover"
      />

      {/* Dark Gradient Overlay */}
      <View style={styles.gradientOverlay} />

      {/* Content Text */}
      <View style={styles.tileInfo}>
        <Text style={styles.tileTitle}>{tile.title}</Text>
        <Text style={styles.tileSub}>{tile.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
};

interface CategoryHubGridProps {
  selectedCategory: CategoryKey;
  onSelectCategory: (category: CategoryKey) => void;
}

export const CategoryHubGrid: React.FC<CategoryHubGridProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.gridContainer}>
      {CATEGORY_TILES.map((tile) => {
        const isSelected = selectedCategory === tile.id;
        return (
          <TileCardItem
            key={tile.id}
            tile={tile}
            isSelected={isSelected}
            onSelect={() => {
              if (onSelectCategory) onSelectCategory(tile.id);
              router.push(`/explore/${tile.id}` as any);
            }}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  tileCard: {
    width: Platform.OS === 'web' ? ('calc(33.333% - 8px)' as any) : '48%',
    minWidth: 155,
    aspectRatio: 16 / 10,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#181924',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bgImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 12, 15, 0.62)',
  },
  accentPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  tileInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  tileTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  tileSub: {
    color: '#d1d5db',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  selectedCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
});
