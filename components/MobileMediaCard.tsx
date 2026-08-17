import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MediaItem } from '../types/media';

interface MobileMediaCardProps {
  item: MediaItem;
  width?: number | string;
  style?: StyleProp<ViewStyle>;
}

export const MobileMediaCard: React.FC<MobileMediaCardProps> = ({ item, width = 150, style }) => {
  const handlePress = () => {
    router.push(`/watch/${item.media_type || 'movie'}/${item.id}`);
  };

  const isFixed = typeof width === 'number';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[
        styles.card,
        isFixed ? { width, marginRight: 12 } : { width: '100%', marginRight: 0 },
        style,
      ]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.poster_path }}
          style={styles.poster}
          resizeMode="cover"
        />

        {/* Top-Left Rating Star Badge */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={10} color="#f59e0b" />
          <Text style={styles.ratingText}>
            {typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : '8.0'}
          </Text>
        </View>

        {/* Top-Right Quality Badge */}
        <View style={styles.qualityBadge}>
          <Text style={styles.qualityText}>
            {item.quality?.includes('4K') ? '4K' : 'HD'}
          </Text>
        </View>

        {/* Bottom Dark Gradient Shadow Mask */}
        <View style={styles.gradientOverlay} />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {(item.media_type || 'tv').toUpperCase()} • {item.genres?.[0] || 'Drama'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#14141d',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 2 / 3,
    position: 'relative',
    backgroundColor: '#0a0a0d',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 3,
    zIndex: 5,
  },
  ratingText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '800',
  },
  qualityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(229, 9, 20, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 5,
  },
  qualityText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  infoContainer: {
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  title: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },
});
