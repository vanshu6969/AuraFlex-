import React from 'react';
import { View, Text, FlatList, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MediaCard } from './MediaCard';
import { MediaItem } from '../types/media';

export interface RecentlyAddedProps {
  title?: string;
  items: MediaItem[];
  variant?: 'carousel' | 'grid';
  onExplorePress?: () => void;
}

export const RecentlyAdded: React.FC<RecentlyAddedProps> = ({
  title = 'Recently Added',
  items,
  variant = 'grid',
  onExplorePress,
}) => {
  if (!items || items.length === 0) return null;

  const handleExplore = () => {
    if (onExplorePress) {
      onExplorePress();
    } else {
      router.push('/series');
    }
  };

  return (
    <View style={styles.sectionContainer}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.redIndicator} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <TouchableOpacity style={styles.exploreBtn} onPress={handleExplore} activeOpacity={0.7}>
          <Text style={styles.exploreText}>View All</Text>
          <Ionicons name="chevron-forward" size={14} color="#e50914" />
        </TouchableOpacity>
      </View>

      {/* Media Grid or Carousel */}
      {variant === 'carousel' ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={items}
          keyExtractor={(item, index) => `${item.media_type}-${item.id}-${item.season || 0}-${item.episode || 0}-${index}`}
          renderItem={({ item }) => <MediaCard item={item} width={155} />}
          contentContainerStyle={styles.carouselContent}
        />
      ) : (
        <View
          style={[
            styles.gridContainer,
            Platform.OS === 'web' && ({
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 16,
            } as any),
          ]}
        >
          {items.map((item, index) => (
            <View
              key={`${item.media_type}-${item.id}-${item.season || 0}-${item.episode || 0}-${index}`}
              style={styles.gridWrapper}
            >
              <MediaCard item={item} width="100%" />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginVertical: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redIndicator: {
    width: 3.5,
    height: 17,
    borderRadius: 2,
    backgroundColor: '#e50914',
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingLeft: 8,
  },
  exploreText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  carouselContent: {
    paddingLeft: 16,
    paddingRight: 6,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
    gap: 14,
  },
  gridWrapper: {
    width: Platform.OS === 'web' ? '100%' : 150,
    marginBottom: 14,
  },
});
