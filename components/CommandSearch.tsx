import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { tmdbService } from '../lib/tmdb';
import { MediaItem } from '../types/media';

interface CommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandSearch: React.FC<CommandSearchProps> = ({ isOpen, onClose }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<TextInput>(null);

  // Global Ctrl + K / '/' keyboard shortcut listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          onClose();
        }
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced TMDB Multi-search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      tmdbService
        .searchMedia(query.trim())
        .then((data) => {
          setResults(data);
          setSelectedIndex(0);
        })
        .finally(() => setLoading(false));
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectItem = (item: MediaItem) => {
    onClose();
    router.push(`/watch/${item.media_type || 'movie'}/${item.id}`);
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType={isMobile ? 'slide' : 'fade'} onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={isMobile ? undefined : onClose}
        style={[styles.backdrop, isMobile && styles.mobileBackdrop]}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.dialogCard, isMobile && styles.mobileDialogCard]}
        >
          {/* Search Input Bar */}
          <View style={[styles.inputBar, isMobile && styles.mobileInputBar]}>
            <Ionicons name="search" size={20} color="#e50914" />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search movies, series, anime..."
              placeholderTextColor="#9ca3af"
              style={styles.textInput}
              autoCapitalize="none"
              returnKeyType="search"
            />

            {/* Quick Clear ✕ Button */}
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}

            {/* Desktop Shortcut Badge (hidden on mobile) */}
            {!isMobile && query.length === 0 && (
              <View style={styles.kbdBadge}>
                <Text style={styles.kbdText}>Ctrl + K</Text>
              </View>
            )}

            {/* Mobile Cancel Button */}
            {isMobile && (
              <TouchableOpacity onPress={onClose} style={styles.mobileCancelBtn} activeOpacity={0.7}>
                <Text style={styles.mobileCancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Results List */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#e50914" />
              <Text style={styles.loadingText}>Searching TMDB library...</Text>
            </View>
          ) : results.length > 0 ? (
            <ScrollView
              style={[styles.resultsScroll, isMobile && styles.mobileResultsScroll]}
              contentContainerStyle={styles.resultsPadding}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.sectionTitle}>SEARCH RESULTS ({results.length})</Text>

              {results.slice(0, 12).map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const releaseYear = (item.release_date || item.first_air_date || '').substring(0, 4);

                return (
                  <TouchableOpacity
                    key={`${item.media_type}_${item.id}_${idx}`}
                    activeOpacity={0.8}
                    onPress={() => handleSelectItem(item)}
                    style={[styles.resultItem, isSelected && styles.resultItemActive]}
                  >
                    <Image source={{ uri: item.poster_path || item.backdrop_path }} style={styles.posterThumb} resizeMode="cover" />

                    <View style={styles.resultInfo}>
                      <View style={styles.titleMetaRow}>
                        <Text style={styles.resultTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.ratingBadge}>⭐ {item.vote_average ? item.vote_average.toFixed(1) : '8.0'}</Text>
                      </View>

                      <View style={styles.subMetaRow}>
                        <Text style={styles.mediaTypeTag}>
                          {item.media_type === 'tv' ? 'TV SHOW' : item.media_type === 'anime' ? 'ANIME' : 'MOVIE'}
                        </Text>
                        {releaseYear ? <Text style={styles.metaDot}>•</Text> : null}
                        {releaseYear ? <Text style={styles.metaYear}>{releaseYear}</Text> : null}
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.genreTag} numberOfLines={1}>
                          {item.genres?.[0] || 'Entertainment'}
                        </Text>
                      </View>
                    </View>

                    <Ionicons name="chevron-forward" size={16} color="#6b7280" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : query.trim().length > 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="alert-circle-outline" size={28} color="#6b7280" />
              <Text style={styles.emptyText}>No titles match "{query}"</Text>
            </View>
          ) : (
            <View style={styles.initialBox}>
              <Ionicons name="flash-outline" size={24} color="#e50914" />
              <Text style={styles.initialText}>Type to instant search across all movies & TV series</Text>
            </View>
          )}

          {/* Desktop Only Dialog Footer */}
          {!isMobile && (
            <View style={styles.dialogFooter}>
              <Text style={styles.footerHint}>Press Esc or tap outside to close</Text>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'web' ? 80 : 50,
    paddingHorizontal: 16,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        } as any)
      : {}),
  },
  mobileBackdrop: {
    paddingTop: 0,
    paddingHorizontal: 0,
    backgroundColor: '#0b0c0f',
  },
  dialogCard: {
    width: '100%',
    maxWidth: 580,
    backgroundColor: '#12141a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
  },
  mobileDialogCard: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: '#0b0c0f',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  mobileInputBar: {
    paddingTop: Platform.OS === 'ios' ? 48 : 18,
    paddingBottom: 14,
    backgroundColor: '#12141a',
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  clearBtn: {
    padding: 4,
  },
  kbdBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  kbdText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  mobileCancelBtn: {
    paddingLeft: 6,
    paddingRight: 2,
  },
  mobileCancelText: {
    color: '#e50914',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  resultsScroll: {
    maxHeight: 380,
  },
  mobileResultsScroll: {
    flex: 1,
    maxHeight: '100%' as any,
  },
  resultsPadding: {
    padding: 12,
  },
  sectionTitle: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  resultItemActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    borderColor: 'rgba(229, 9, 20, 0.3)',
    borderWidth: 1,
  },
  posterThumb: {
    width: 38,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#181924',
  },
  resultInfo: {
    flex: 1,
  },
  titleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  resultTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  ratingBadge: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  mediaTypeTag: {
    color: '#e50914',
    fontSize: 10,
    fontWeight: '800',
  },
  metaDot: {
    color: '#4b5563',
    fontSize: 10,
  },
  metaYear: {
    color: '#9ca3af',
    fontSize: 11,
  },
  genreTag: {
    color: '#9ca3af',
    fontSize: 11,
  },
  emptyBox: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  initialBox: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 8,
  },
  initialText: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
  },
  dialogFooter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  footerHint: {
    color: '#6b7280',
    fontSize: 11,
  },
});
