import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WatchProgress } from '../types/media';
import { storageService } from '../lib/storage';

interface ContinueWatchingCardProps {
  item: WatchProgress;
  onRemove?: (mediaId: string | number) => void;
}

export const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ item, onRemove }) => {
  const media = item.media;
  const isSeries = media?.media_type && media.media_type !== 'movie';
  const mediaType = media?.media_type || 'movie';

  // Calculate watched percentage (default to 45% if not set)
  let percent = 45;
  if (item.currentTime && item.duration && item.duration > 0) {
    percent = Math.min(100, Math.max(10, Math.floor((item.currentTime / item.duration) * 100)));
  }

  const handleRemove = async (e: any) => {
    e?.stopPropagation?.();
    if (onRemove) {
      onRemove(item.mediaId);
    } else {
      // Remove progress item
      try {
        const raw = await storageService.getContinueWatching();
        const updated = raw.filter((p) => String(p.mediaId) !== String(item.mediaId));
        await storageService.saveProgress(item.media, 0, 0, item.season, item.episode);
      } catch (err) {}
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/watch/${mediaType}/${item.mediaId}`)}
      style={styles.card}
    >
      {/* Backdrop Image Container */}
      <View style={styles.imageBox}>
        <Image
          source={{ uri: media?.backdrop_path || media?.poster_path }}
          style={styles.backdropImg}
          resizeMode="cover"
        />

        {/* Dark Vignette Gradient Overlay */}
        <View style={styles.vignetteOverlay} />

        {/* Top Header Badge Row */}
        <View style={styles.topBadgeRow}>
          <View style={styles.typeBadge}>
            <Ionicons
              name={isSeries ? 'tv-outline' : 'film-outline'}
              size={11}
              color={isSeries ? '#ff3b47' : '#38bdf8'}
            />
            <Text style={[styles.typeBadgeText, { color: isSeries ? '#ff3b47' : '#38bdf8' }]}>
              {isSeries ? `S${item.season || 1} • E${item.episode || 1}` : 'MOVIE'}
            </Text>
          </View>

          {onRemove && (
            <TouchableOpacity onPress={handleRemove} style={styles.removeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={12} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Center Play Button Overlay */}
        <View style={styles.centerPlayOverlay}>
          <View style={styles.playGlowCircle}>
            <Ionicons name="play" size={18} color="#ffffff" style={{ marginLeft: 2 }} />
          </View>
        </View>

        {/* Red Bottom Progress Bar Line */}
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
    width: 230,
    backgroundColor: '#14141d',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  imageBox: {
    width: '100%',
    height: 125,
    position: 'relative',
    backgroundColor: '#0a0a0d',
  },
  backdropImg: {
    width: '100%',
    height: '100%',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.35)',
  },
  topBadgeRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  removeBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  centerPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  playGlowCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e50914',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  progressBarBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 15,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#e50914',
  },
  infoBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  subtitleText: {
    color: '#ff3b47',
    fontSize: 11,
    fontWeight: '700',
  },
  percentText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '600',
  },
});
