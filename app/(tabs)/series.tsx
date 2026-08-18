import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MediaSection } from '../../components/MediaSection';
import { CategoryHubGrid, CategoryKey, CATEGORY_TILES } from '../../components/CategoryHubGrid';
import { tmdbService } from '../../lib/tmdb';
import { MediaItem } from '../../types/media';

export default function ExploreSeriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [categoryItems, setCategoryItems] = useState<MediaItem[]>([]);
  const [loadingCategory, setLoadingCategory] = useState(false);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setCategoryItems([]);
      return;
    }

    setLoadingCategory(true);

    let fetcher: Promise<MediaItem[]>;
    switch (selectedCategory) {
      case 'action':
        fetcher = tmdbService.getActionAdventureCollection();
        break;
      case 'anime':
        fetcher = tmdbService.getAnimeCollection();
        break;
      case 'comedy':
        fetcher = tmdbService.getComedyCollection();
        break;
      case 'kdrama':
        fetcher = tmdbService.getKdramaCollection();
        break;
      case 'punjabi':
        fetcher = tmdbService.getPunjabiBollywoodCollection();
        break;
      case 'marvel':
        fetcher = tmdbService.getMarvelDCCollection();
        break;
      default:
        fetcher = Promise.resolve([]);
    }

    fetcher
      .then((items) => {
        const formatted = items.map((item) => ({ ...item, media_type: (item.media_type || 'tv') as any }));
        setCategoryItems(formatted);
      })
      .catch(() => {
        setCategoryItems([]);
      })
      .finally(() => {
        setLoadingCategory(false);
      });
  }, [selectedCategory]);

  const isCategorySelected = selectedCategory !== 'all';

  const getCategoryTitle = (key: CategoryKey): string => {
    switch (key) {
      case 'action':
        return 'Action & Adventure';
      case 'anime':
        return 'Anime Universe';
      case 'comedy':
        return 'Comedy & Sitcoms';
      case 'kdrama':
        return 'K-Drama & Asian';
      case 'punjabi':
        return 'Punjabi & Hindi';
      case 'marvel':
        return 'Sci-Fi & Superhero';
      default:
        return 'Select Category';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Explore Categories</Text>
          <Text style={styles.headerSub}>
            Tap any category tile below to browse media
          </Text>
        </View>
      </View>


      {/* Visual Category Hub Tiles Grid */}
      <CategoryHubGrid
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* Active Category Header Bar or Initial Prompt */}
      {isCategorySelected ? (
        <View style={styles.activeFilterBar}>
          <Text style={styles.activeFilterText}>
            Category: <Text style={styles.activeFilterName}>{getCategoryTitle(selectedCategory)}</Text> ({categoryItems.length} titles)
          </Text>
          <TouchableOpacity
            onPress={() => setSelectedCategory('all')}
            style={styles.clearFilterBtn}
          >
            <Ionicons name="close-circle" size={18} color="#e50914" />
            <Text style={styles.clearFilterText}>Back to Categories</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.promptCard}>
          <Ionicons name="apps-outline" size={32} color="#e50914" />
          <Text style={styles.promptTitle}>Select a Category to Explore</Text>
          <Text style={styles.promptSub}>
            Click on any of the colorful category cards above to display curated titles.
          </Text>
        </View>
      )}

      {/* Render Category Media ONLY when a category is selected */}
      {isCategorySelected && (
        loadingCategory ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#e50914" />
            <Text style={styles.loadingText}>Loading {getCategoryTitle(selectedCategory)} titles...</Text>
          </View>
        ) : (
          <View style={styles.rowsContainer}>
            <MediaSection
              title={`${getCategoryTitle(selectedCategory)} Collection`}
              items={categoryItems}
              variant="grid"
            />
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c0f',
  },
  contentPadding: {
    paddingBottom: 90,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    zIndex: 20,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 10,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 4,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 30,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181924',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  dropdownBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 46,
    right: 0,
    width: 200,
    backgroundColor: '#14151f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 6,
    zIndex: 50,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: '#e50914',
  },
  menuText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
  },
  menuTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  activeFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: '#12141a',
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFilterText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  activeFilterName: {
    color: '#ffffff',
    fontWeight: '800',
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearFilterText: {
    color: '#e50914',
    fontSize: 12,
    fontWeight: '800',
  },
  promptCard: {
    backgroundColor: '#12141a',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 8,
    marginBottom: 20,
  },
  promptTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
  },
  promptSub: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  rowsContainer: {
    gap: 6,
  },
});
