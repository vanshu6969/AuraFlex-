import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { MediaCard } from './MediaCard';
import { MediaItem } from '../types/media';

export interface MediaSectionProps {
  title: string;
  items: MediaItem[];
  variant?: 'carousel' | 'grid';
  onExplorePress?: () => void;
  exploreRoute?: string;
}

export const MediaSection: React.FC<MediaSectionProps> = ({
  title,
  items,
  variant = 'carousel',
  onExplorePress,
  exploreRoute,
}) => {
  if (!items || items.length === 0) return null;

  // Clean title by stripping emojis if any exist
  const cleanTitle = title.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

  const handleExplore = () => {
    if (onExplorePress) {
      onExplorePress();
    } else if (exploreRoute) {
      router.push(exploreRoute as any);
    } else {
      router.push('/series');
    }
  };

  return (
    <View style={styles.sectionContainer}>
      {/* Clean Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.redIndicator} />
          <Text style={styles.sectionTitle}>{cleanTitle}</Text>
        </View>
      </View>


      {/* Horizontal Scroll Row or Responsive Grid */}
      {variant === 'carousel' ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={items}
          keyExtractor={(item, index) => `${item.id}-${index}`}
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
            <View key={`${item.id}-${index}`} style={styles.gridWrapper}>
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
    marginVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redIndicator: {
    width: 3.5,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#e50914',
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  exploreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingLeft: 8,
  },
  exploreText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  exploreChevron: {
    color: '#e50914',
    fontSize: 14,
    fontWeight: '700',
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
