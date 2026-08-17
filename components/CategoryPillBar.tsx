import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export interface CategoryOption {
  id: string;
  label: string;
  icon?: string;
}

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { id: 'all', label: '🔥 All Featured' },
  { id: 'punjabi', label: '🌾 Punjabi' },
  { id: 'kdrama', label: '🌸 KDrama' },
  { id: 'movies', label: '🍿 Movies' },
  { id: 'series', label: '📺 Series' },
  { id: 'anime', label: '🔮 Anime' },
  { id: 'action', label: '💥 Action' },
  { id: 'comedy', label: '😂 Comedy' },
];

interface CategoryPillBarProps {
  activeId: string;
  onSelect: (id: string) => void;
  categories?: CategoryOption[];
}

export const CategoryPillBar: React.FC<CategoryPillBarProps> = ({
  activeId,
  onSelect,
  categories = DEFAULT_CATEGORIES,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => {
          const isActive = cat.id === activeId;
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.75}
              onPress={() => onSelect(cat.id)}
              style={[styles.pill, isActive && styles.activePill]}
            >
              <Text style={[styles.pillText, isActive && styles.activePillText]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  activePill: {
    backgroundColor: '#e50914',
    borderColor: '#ff3b47',
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  pillText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  activePillText: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
