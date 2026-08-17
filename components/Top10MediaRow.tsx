import React from 'react';
import { View, Text, FlatList, StyleSheet, Platform } from 'react-native';
import { MobileMediaCard } from './MobileMediaCard';
import { MediaItem } from '../types/media';

interface Top10MediaRowProps {
  title?: string;
  items: MediaItem[];
}

export const Top10MediaRow: React.FC<Top10MediaRowProps> = ({
  title = '🏆 Top 10 Media Today',
  items,
}) => {
  if (!items || items.length === 0) return null;
  const top10 = items.slice(0, 10);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.accentBar} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={top10}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.carouselPadding}
        renderItem={({ item, index }) => (
          <View style={styles.top10Wrapper}>
            {/* Stylized Giant Netflix-style Rank Number */}
            <View style={styles.numberBox}>
              <Text
                style={[
                  styles.rankNumber,
                  Platform.OS === 'web' && ({
                    WebkitTextStroke: '2px #e50914',
                    color: '#0f0f15',
                  } as any),
                ]}
              >
                {index + 1}
              </Text>
            </View>

            {/* Poster Card Overlapping Rank Number */}
            <View style={styles.cardBox}>
              <MobileMediaCard item={item} width={145} />
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
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
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  carouselPadding: {
    paddingLeft: 12,
    paddingRight: 16,
  },
  top10Wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 16,
    position: 'relative',
  },
  numberBox: {
    justifyContent: 'flex-end',
    marginRight: -25,
    zIndex: 1,
    paddingBottom: 20,
  },
  rankNumber: {
    fontSize: 90,
    fontWeight: '900',
    color: '#e50914',
    lineHeight: 85,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-black',
  },
  cardBox: {
    zIndex: 2,
  },
});
