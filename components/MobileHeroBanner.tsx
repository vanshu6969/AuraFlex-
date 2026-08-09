import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MediaItem } from '../types/media';

import { storageService } from '../lib/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MobileHeroBannerProps {
  items: MediaItem[];
}

export const MobileHeroBanner: React.FC<MobileHeroBannerProps> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const currentItem = items[currentIndex] || items[0];

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [items.length]);

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

  if (!currentItem) return null;

  return (
    <View style={styles.container}>
      <Image source={{ uri: currentItem.backdrop_path }} style={styles.backdrop} resizeMode="cover" />
      <View style={styles.gradientOverlay} />

      <View style={styles.contentContainer}>
        <View style={styles.tagRow}>
          <View style={styles.ratingTag}>
            <Ionicons name="star" size={12} color="#f59e0b" />
            <Text style={styles.ratingText}>{currentItem.vote_average.toFixed(1)}</Text>
          </View>
          <View style={styles.qualityTag}>
            <Text style={styles.qualityText}>{currentItem.quality || '4K Ultra HD'}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {currentItem.title}
        </Text>

        <Text style={styles.overview} numberOfLines={2}>
          {currentItem.overview}
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push(`/watch/${currentItem.media_type}/${currentItem.id}`)}
            style={styles.watchButton}
          >
            <Ionicons name="play" size={18} color="#ffffff" />
            <Text style={styles.watchText}>Watch Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
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

        {/* Carousel Indicators */}
        <View style={styles.indicatorRow}>
          {items.slice(0, 5).map((_, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setCurrentIndex(idx)}
              style={[styles.dot, idx === currentIndex && styles.activeDot]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: 380,
    position: 'relative',
    backgroundColor: '#0f0f12',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 15, 18, 0.55)',
  },
  contentContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  ratingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    gap: 4,
  },
  ratingText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '700',
  },
  qualityTag: {
    backgroundColor: 'rgba(229, 9, 20, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.4)',
  },
  qualityText: {
    color: '#e50914',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  overview: {
    color: '#d1d5db',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e50914',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  watchText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  watchlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 31, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6,
  },
  watchlistActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  watchlistText: {
    color: '#ffffff',
    fontSize: 13,
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
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    width: 20,
    backgroundColor: '#e50914',
  },
});
