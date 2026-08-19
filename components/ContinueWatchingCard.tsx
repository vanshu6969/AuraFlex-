import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WatchProgress } from '../types/media';
import { storageService } from '../lib/storage';

interface ContinueWatchingCardProps {
  item: WatchProgress;
  onRemove?: (mediaId: string | number) => void;
}

export const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ item, onRemove }) => {
  const [isHovered, setIsHovered] = useState(false);
  const media = item.media;
  const isSeries = media?.media_type && media.media_type !== 'movie';
  const mediaType = media?.media_type || 'movie';

  // Calculate watched percentage (default to 65% if not set)
  let percent = 65;
  if (item.currentTime && item.duration && item.duration > 0) {
    percent = Math.min(100, Math.max(10, Math.floor((item.currentTime / item.duration) * 100)));
  }

  const handleRemove = async (e: any) => {
    e?.stopPropagation?.();
    await storageService.removeProgress(item.mediaId);
    if (onRemove) {
      onRemove(item.mediaId);
    }
  };

  const episodeTagText = isSeries ? `S${item.season || 1} • E${item.episode || 1}` : 'MOVIE';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => router.push(`/watch/${mediaType}/${item.mediaId}`)}
      style={styles.card}
      {...(Platform.OS === 'web'
        ? ({
            onMouseEnter: () => setIsHovered(true),
            onMouseLeave: () => setIsHovered(false),
          } as any)
        : {})}
    >
      {/* Backdrop Image Container */}
      <View style={styles.imageBox}>
        <Image
          source={{ uri: media?.backdrop_path || media?.poster_path }}
          style={styles.backdropImg}
          resizeMode="cover"
        />

        {/* Dark Vignette Overlay */}
        <View style={styles.vignetteOverlay} />

        {/* Top Header Badge Row */}
        <View style={styles.topBadgeRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{episodeTagText}</Text>
          </View>

          {onRemove && (
            <TouchableOpacity onPress={handleRemove} style={styles.removeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={12} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Hover Play Button Overlay (Reveals on hover) */}
        {isHovered && (
          <View style={styles.hoverPlayOverlay}>
            <View style={styles.hoverPlayCircle}>
              <Ionicons name="play" size={18} color="#ffffff" style={{ marginLeft: 2 }} />
            </View>
          </View>
        )}

        {/* Illuminated Red Bottom Progress Bar */}
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
        </View>
      </View>

      {/* Card Info Footer */}
      <View style={styles.infoBox}>
        <Text style={styles.titleText} numberOfLines={1}>
          {media?.title || 'Untitled'}
        </Text>

        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>
            {isSeries
              ? `Season ${item.season || 1} • Episode ${item.episode || 1}`
              : 'Movie • Resume Stream'}
          </Text>
          <Text style={styles.percentText}>{percent}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#12141a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  imageBox: {
    width: '100%',
    height: 125,
    position: 'relative',
    backgroundColor: '#181924',
  },
  backdropImg: {
    width: '100%',
    height: '100%',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 12, 15, 0.45)',
  },
  topBadgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  typeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  removeBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  hoverPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  hoverPlayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e50914',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  progressBarBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#e50914',
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  infoBox: {
    padding: 12,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  subtitleText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '500',
  },
  percentText: {
    color: '#e50914',
    fontSize: 11,
    fontWeight: '800',
  },
});
