import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MediaItem } from '../types/media';


interface MobileMediaCardProps {
  item: MediaItem;
  width?: number;
}

export const MobileMediaCard: React.FC<MobileMediaCardProps> = ({ item, width = 140 }) => {
  const handlePress = () => {
    router.push(`/watch/${item.media_type}/${item.id}`);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.card, { width }]}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.poster_path }} style={styles.poster} resizeMode="cover" />
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={10} color="#f59e0b" />
          <Text style={styles.ratingText}>{item.vote_average.toFixed(1)}</Text>
        </View>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.subtitle}>
          {item.media_type.toUpperCase()} • {item.genres[0] || 'HD'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginRight: 12,
    backgroundColor: '#18181f',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 2 / 3,
    position: 'relative',
    backgroundColor: '#000',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '700',
  },
  infoContainer: {
    padding: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
});
