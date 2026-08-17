import React from 'react';
import { View, Text, FlatList, StyleSheet, Platform } from 'react-native';

import { MobileMediaCard } from './MobileMediaCard';
import { MediaItem } from '../types/media';

interface MobileMediaGridProps {
  title: string;
  items: MediaItem[];
  variant?: 'carousel' | 'grid';
}

export const MobileMediaGrid: React.FC<MobileMediaGridProps> = ({
  title,
  items,
  variant = 'carousel',
}) => {
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.accentBar} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      {variant === 'carousel' ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <MobileMediaCard item={item} width={155} />}
          contentContainerStyle={styles.carouselPadding}
        />
      ) : (
        <View
          style={[
            styles.gridContainer,
            Platform.OS === 'web' && ({
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
              gap: 16,
            } as any),
          ]}
        >
          {items.map((item) => (
            <View key={item.id} style={styles.gridCardWrapper}>
              <MobileMediaCard item={item} width="100%" />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 8,
  },
  accentBar: {
    width: 4,
    height: 18,
    backgroundColor: '#e50914',
    borderRadius: 2,
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  carouselPadding: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
    gap: 14,
  },
  gridCardWrapper: {
    width: Platform.OS === 'web' ? '100%' : 155,
    marginBottom: 14,
  },
});
