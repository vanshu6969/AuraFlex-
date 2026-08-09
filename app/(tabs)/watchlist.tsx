import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { MobileMediaGrid } from '../../components/MobileMediaGrid';
import { storageService, subscribeStorage } from '../../lib/storage';
import { MediaItem } from '../../types/media';


export default function WatchlistScreen() {
  const [watchlist, setWatchlist] = useState<MediaItem[]>([]);

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerBar}>
        <View style={styles.titleGroup}>
          <View style={styles.iconCircle}>
            <Ionicons name="bookmark" size={18} color="#e50914" />
          </View>
          <View>
            <Text style={styles.heading}>Your Watchlist</Text>
            <Text style={styles.subheading}>Synced to Supabase & AsyncStorage</Text>
          </View>
        </View>

        {watchlist.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={14} color="#f87171" />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {watchlist.length > 0 ? (
        <MobileMediaGrid title={`Saved Titles (${watchlist.length})`} items={watchlist} variant="grid" />
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="bookmark-outline" size={40} color="#6b7280" />
          <Text style={styles.emptyTitle}>Watchlist is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Save your favorite movies & TV shows by tapping "+ Watchlist" on any title.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f12',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  subheading: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 1,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  clearText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    marginHorizontal: 16,
    marginTop: 40,
    backgroundColor: '#18181f',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
  },
});
