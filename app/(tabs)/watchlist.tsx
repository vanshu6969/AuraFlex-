import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { MobileMediaGrid } from '../../components/MobileMediaGrid';
import { storageService, subscribeStorage } from '../../lib/storage';
import { MediaItem } from '../../types/media';
import { useTheme } from '../../lib/themeContext';

export default function WatchlistScreen() {
  const [watchlist, setWatchlist] = useState<MediaItem[]>([]);
  const { colors } = useTheme();

  useEffect(() => {
    storageService.getWatchlist().then(setWatchlist);
    const unsubscribe = subscribeStorage(() => {
      storageService.getWatchlist().then(setWatchlist);
    });
    return unsubscribe;
  }, []);

  const handleClearAll = async () => {
    for (const item of watchlist) {
      await storageService.removeFromWatchlist(item.id);
    }
    setWatchlist([]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>
      {/* Page Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border }]}>
        <View style={styles.titleGroup}>
          <View style={styles.iconCircle}>
            <Ionicons name="bookmark" size={20} color="#e50914" />
          </View>
          <View>
            <Text style={[styles.heading, { color: colors.text }]}>Your Watchlist</Text>
            <Text style={styles.subheading}>Synced with Supabase Cloud & Local Storage</Text>
          </View>
        </View>

        {watchlist.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={14} color="#ef4444" />
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Watchlist Grid or Empty State */}
      {watchlist.length > 0 ? (
        <View style={styles.gridSection}>
          <MobileMediaGrid title={`Saved Titles (${watchlist.length})`} items={watchlist} variant="grid" />
        </View>
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="bookmark-outline" size={32} color="#6b7280" />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Watchlist is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Save your favorite movies, TV series, and anime by tapping "+ Watchlist" on any title.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentPadding: {
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subheading: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  clearText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  gridSection: {
    marginTop: 8,
  },
  emptyCard: {
    margin: 16,
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});
