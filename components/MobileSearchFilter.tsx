import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { GENRE_PILLS } from '../lib/mediaData';

interface MobileSearchFilterProps {
  onSearch: (query: string, category: string, selectedGenre: string) => void;
  initialQuery?: string;
}

export const MobileSearchFilter: React.FC<MobileSearchFilterProps> = ({
  onSearch,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('All');

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(query, category, selectedGenre);
    }, 350);

    return () => clearTimeout(handler);
  }, [query, category, selectedGenre]);

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#9ca3af" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search movies, TV shows, genres..."
          placeholderTextColor="#6b7280"
          style={styles.input}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Pills */}
      <View style={styles.categoryRow}>
        {[
          { label: 'All', id: 'all' },
          { label: 'Movies', id: 'movie' },
          { label: 'TV Shows', id: 'tv' },
          { label: 'Animation', id: 'animation' },
        ].map((cat) => {
          const isActive = category === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setCategory(cat.id)}
              style={[styles.catChip, isActive && styles.catChipActive]}
            >
              <Text style={[styles.catText, isActive && styles.catTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Genre Pills Horizontal Scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreScroll}>
        {GENRE_PILLS.map((genre) => {
          const isActive = selectedGenre === genre;
          return (
            <TouchableOpacity
              key={genre}
              onPress={() => setSelectedGenre(genre)}
              style={[styles.genreChip, isActive && styles.genreChipActive]}
            >
              <Text style={[styles.genreText, isActive && styles.genreTextActive]}>{genre}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181f',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    padding: 0,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#18181f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  catChipActive: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  catText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  catTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  genreScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  genreChipActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    borderWidth: 1,
    borderColor: '#e50914',
  },
  genreText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '500',
  },
  genreTextActive: {
    color: '#e50914',
    fontWeight: '700',
  },
});
