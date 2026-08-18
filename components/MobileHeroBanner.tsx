import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';

import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MediaItem } from '../types/media';
import { storageService } from '../lib/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');





interface MobileHeroBannerProps {
  items?: MediaItem[];
  item?: MediaItem;
}

export const MobileHeroBanner: React.FC<MobileHeroBannerProps> = ({ items, item }) => {
  const itemList = items && items.length > 0 ? items : (item ? [item] : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);



  const handleNext = () => {
    if (!itemList || itemList.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % itemList.length);
  };

  const handlePrev = () => {
    if (!itemList || itemList.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + itemList.length) % itemList.length);
  };

  // Auto-play timer every 5 seconds
  useEffect(() => {
    if (itemList.length <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [itemList.length, currentIndex]);

  const currentItem = itemList[currentIndex] || itemList[0];

  useEffect(() => {
    if (currentItem) {
      storageService.isInWatchlist(currentItem.id).then(setIsInWatchlist);
    }
  }, [currentItem]);

  const toggleWatchlist = async () => {
    if (!currentItem) return;
    if (isInWatchlist) {
      await storageService.removeFromWatchlist(currentItem.id);
      setIsInWatchlist(false);
    } else {
      await storageService.addToWatchlist(currentItem);
      setIsInWatchlist(true);
    }
  };

  // Touch Swipe Gesture Handlers
  const handleTouchStart = (e: any) => {
    if (e.nativeEvent && e.nativeEvent.pageX) {
      setTouchStart(e.nativeEvent.pageX);
    }
  };

  const handleTouchEnd = (e: any) => {
    if (touchStart === null) return;
    const touchEnd = e.nativeEvent ? e.nativeEvent.pageX : null;
    if (touchEnd !== null) {
      const distance = touchStart - touchEnd;
      if (distance > 40) {
        handleNext();
      } else if (distance < -40) {
        handlePrev();
      }
    }
    setTouchStart(null);
  };

  if (!currentItem) return null;

  // Formatting metadata strings
  const year = currentItem.release_date?.substring(0, 4) || currentItem.first_air_date?.substring(0, 4) || '2024';
  const typeText = currentItem.media_type === 'movie' 
    ? 'Movie' 
    : (currentItem.episodes_count ? `${Math.max(1, Math.ceil(currentItem.episodes_count / 10))} Seasons` : '2 Seasons');
  const genresText = currentItem.genres && currentItem.genres.length > 0 
    ? currentItem.genres.slice(0, 2).join(' / ').toUpperCase() 
    : 'ACTION / DRAMA';
  const ratingText = `IMDb ${(currentItem.vote_average || 8.1).toFixed(1)}`;
  const qualityText = currentItem.quality || '4K Ultra HD';

  return (
    <View
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Image source={{ uri: currentItem.backdrop_path }} style={styles.backdrop} resizeMode="cover" />
      <View style={styles.gradientOverlay} />

      <View style={styles.contentContainer}>
        {/* Category Kicker */}
        <Text style={styles.categoryKicker}>{genresText}</Text>

        <Text style={styles.title} numberOfLines={2}>
          {currentItem.title}
        </Text>

        {/* Sleek Metadata Text */}
        <View style={styles.metadataRow}>
          <Text style={styles.metadataText}>{ratingText}</Text>
          <Text style={styles.bulletSeparator}>•</Text>
          <Text style={styles.metadataText}>{year}</Text>
          <Text style={styles.bulletSeparator}>•</Text>
          <Text style={styles.metadataText}>{typeText}</Text>
          <Text style={styles.bulletSeparator}>•</Text>
          <Text style={styles.metadataText}>{qualityText}</Text>
        </View>

        <Text style={styles.overview} numberOfLines={2}>
          {currentItem.overview}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push(`/watch/${currentItem.media_type}/${currentItem.id}`)}
            style={styles.watchButton}
          >
            <Ionicons name="play" size={18} color="#000000" />
            <Text style={styles.watchText}>Watch Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={toggleWatchlist}
            style={[styles.watchlistButton, isInWatchlist && styles.watchlistActive]}
          >




            <Ionicons
              name={isInWatchlist ? 'checkmark' : 'add'}
              size={18}
              color={isInWatchlist ? '#10b981' : '#ffffff'}
            />
            <Text style={[styles.watchlistText, isInWatchlist && styles.watchlistActiveText]}>
              {isInWatchlist ? 'Saved' : 'Watchlist'}
            </Text>
          </TouchableOpacity>
        </View>



        {/* Dynamic Capsule Indicator Dots */}
        {itemList.length > 1 && (
          <View style={styles.indicatorRow}>
            {itemList.map((_, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                onPress={() => setCurrentIndex(index)}
                style={[styles.dot, index === currentIndex && styles.activeDot]}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: Platform.OS === 'web' ? 460 : 400,
    position: 'relative',
    backgroundColor: '#0b0c0f',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 12, 15, 0.4)',
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage: 'linear-gradient(to top, #0b0c0f 0%, rgba(11, 12, 15, 0.5) 50%, transparent 100%)',
        } as any)
      : {}),
  },
  contentContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  categoryKicker: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  metadataText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  bulletSeparator: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
  },
  overview: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  watchText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
  downloadHeroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 9, 20, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.5)',
    gap: 6,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(12px)',
        } as any)
      : {}),
  },
  downloadHeroText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  watchlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(12px)',
        } as any)
      : {}),
  },

  watchlistActive: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  watchlistText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  watchlistActiveText: {
    color: '#10b981',
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  activeDot: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
});

