import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MediaItem } from '../types/media';
import { storageService } from '../lib/storage';
import { showToast } from '../lib/toast';
import { PrimaryPlayButton, GlassWatchlistButton } from './ui/AuraButtons';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MobileHeroBannerProps {
  items?: MediaItem[];
  item?: MediaItem;
}

export const MobileHeroBanner: React.FC<MobileHeroBannerProps> = ({ items, item }) => {
  const itemList = items && items.length > 0 ? items : item ? [item] : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const visibleItems = itemList.slice(0, 5);

  const handleNext = () => {
    if (!itemList || itemList.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % visibleItems.length);
  };

  const handlePrev = () => {
    if (!itemList || itemList.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + visibleItems.length) % visibleItems.length);
  };

  // Auto-play timer every 5 seconds
  useEffect(() => {
    if (visibleItems.length <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [visibleItems.length, currentIndex]);

  const currentItem = visibleItems[currentIndex] || visibleItems[0];

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
      showToast('Removed from Watchlist', 'info');
    } else {
      await storageService.addToWatchlist(currentItem);
      setIsInWatchlist(true);
      showToast('Added to Watchlist', 'success');
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
      
      {/* Multi-Stop Seamless Backdrop Gradient Overlay */}
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
          <PrimaryPlayButton
            label="Watch Now"
            size="md"
            onPress={() => router.push(`/watch/${currentItem.media_type || 'movie'}/${currentItem.id}`)}
          />

          <GlassWatchlistButton
            isSaved={isInWatchlist}
            onToggle={toggleWatchlist}
            label="+ Watchlist"
            savedLabel="Saved"
          />
        </View>


        {/* Sleek Pill Indicator Bar (Max 5 items) */}
        {visibleItems.length > 1 && (
          <View style={styles.indicatorRow}>
            {visibleItems.map((_, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                onPress={() => setCurrentIndex(index)}
                style={[styles.pill, index === currentIndex && styles.activePill]}
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
          backgroundImage:
            'linear-gradient(to right, #0b0c0f 0%, rgba(11, 12, 15, 0.75) 40%, rgba(11, 12, 15, 0.3) 70%, transparent 100%), linear-gradient(to top, #0b0c0f 0%, rgba(11, 12, 15, 0.8) 30%, transparent 80%)',
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
    color: '#e50914',
    fontSize: 11,
    fontWeight: '800',
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
    maxWidth: 580,
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
    backgroundColor: '#e50914',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  watchText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  watchlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    gap: 6,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
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
    fontWeight: '700',
  },
  watchlistActiveText: {
    color: '#10b981',
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  pill: {
    width: 8,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  activePill: {
    width: 32,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e50914',
  },
});
