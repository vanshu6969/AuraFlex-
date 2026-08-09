import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

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
  if (items.length === 0) return null;

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
          renderItem={({ item }) => <MobileMediaCard item={item} width={135} />}
          contentContainerStyle={styles.carouselPadding}
        />
      ) : (
        <View style={styles.gridContainer}>
          {items.map((item) => (
            <View key={item.id} style={styles.gridCardWrapper}>
              <MobileMediaCard item={item} width={160} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  accentBar: {
    width: 4,
    height: 18,
    backgroundColor: '#e50914',
    borderRadius: 2,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  carouselPadding: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  gridCardWrapper: {
    marginBottom: 12,
  },
});
