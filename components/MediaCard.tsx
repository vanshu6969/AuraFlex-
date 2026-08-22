import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MediaItem } from '../types/media';

export interface MediaCardProps {
  item: MediaItem;
  width?: number | string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  width = 160,
  style,
  onPress,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (item.season && item.episode) {
      router.push(`/watch/${item.media_type || 'tv'}/${item.id}?season=${item.season}&episode=${item.episode}` as any);
    } else {
      router.push(`/watch/${item.media_type || 'movie'}/${item.id}` as any);
    }
  };

  const isFixed = typeof width === 'number';
  const hasEpisodeInfo = typeof item.season === 'number' && typeof item.episode === 'number';
  
  const genreText = hasEpisodeInfo
    ? `S${item.season} • E${item.episode}`
    : (item.genres?.[0] || item.media_type || 'MOVIE').toUpperCase();
    
  const ratingText = typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : '8.1';
  const qualityText = item.quality?.includes('4K') ? '4K ULTRA HD' : '1080p HD';

  // Fallback image logic: still_path -> poster_path -> backdrop_path -> placeholder
  const imageSource =
    item.still_path ||
    item.poster_path ||
    item.backdrop_path ||
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';

  const displayTitle = hasEpisodeInfo
    ? `${item.title} - S${item.season} E${item.episode}`
    : item.title;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={[
        styles.cardContainer,
        isFixed ? { width } : { width: '100%' },
        style,
      ]}
    >
      {/* Aspect 2:3 Poster Container */}
      <View style={styles.posterWrapper}>
        <Image
          source={{ uri: imageSource }}
          style={styles.posterImage}
          resizeMode="cover"
        />

        {/* Minimal Frosted Glass Rating Badge (Top Left) */}
        <View style={styles.glassBadgeLeft}>
          <Ionicons name="star" size={10} color="#f59e0b" />
          <Text style={styles.badgeText}>{ratingText}</Text>
        </View>

        {/* Top Right Badge: Season/Episode Overlay or Quality Badge */}
        {hasEpisodeInfo ? (
          <View style={styles.episodeBadgeRight}>
            <Text style={styles.episodeBadgeText}>S{item.season} • E{item.episode}</Text>
          </View>
        ) : (
          <View style={styles.glassBadgeRight}>
            <Text style={styles.qualityText}>{qualityText.includes('4K') ? '4K' : 'HD'}</Text>
          </View>
        )}

        {/* Smooth Inner Bottom Multi-stop Linear Gradient */}
        <View style={styles.bottomGradient} />

        {/* Overlay Title & Category Kicker inside Poster Bottom */}
        <View style={styles.posterBottomOverlay}>
          <Text style={[styles.genreKicker, hasEpisodeInfo && { color: '#38bdf8' }]} numberOfLines={1}>
            {genreText}
          </Text>
          <Text style={styles.titleText} numberOfLines={2}>
            {displayTitle}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0b0c0f',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
    ...(Platform.OS === 'web'
      ? ({
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease',
          ':hover': {
            transform: 'scale(1.04)',
            borderColor: 'rgba(229, 9, 20, 0.5)',
          },
        } as any)
      : {}),
  },
  posterWrapper: {
    width: '100%',
    aspectRatio: 2 / 3,
    position: 'relative',
    backgroundColor: '#12131a',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  glassBadgeLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 12, 15, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 4,
    zIndex: 5,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(8px)',
        } as any)
      : {}),
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  glassBadgeRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(11, 12, 15, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 5,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(8px)',
        } as any)
      : {}),
  },
  qualityText: {
    color: '#e50914',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  episodeBadgeRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#e50914',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 5,
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  episodeBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage: 'linear-gradient(to top, #0b0c0f 0%, rgba(11, 12, 15, 0.75) 50%, transparent 100%)',
        } as any)
      : {
          backgroundColor: 'rgba(11, 12, 15, 0.75)',
        }),
  },
  posterBottomOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    zIndex: 4,
  },
  genreKicker: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  titleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
