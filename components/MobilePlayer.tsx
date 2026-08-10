import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';



import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { MediaItem } from '../types/media';

import { EMBED_SERVERS } from '../lib/mediaData';
import { storageService } from '../lib/storage';
import { tmdbService } from '../lib/tmdb';

interface MobilePlayerProps {
  media: MediaItem;
}

const adBlockScript = `
  (function() {
    window.open = function() { return null; };
    window.alert = function() {};
    window.confirm = function() { return false; };
    
    if (typeof screen !== 'undefined' && screen.orientation) {
      try {
        screen.orientation.lock = function() { return Promise.resolve(); };
        screen.orientation.unlock = function() { return Promise.resolve(); };
      } catch (e) {}
    }

    try {
      Object.defineProperty(window, 'onbeforeunload', {
        configurable: false,
        writable: false,
        value: function() {}
      });
    } catch (e) {}
  })();
  true;
`;


export const MobilePlayer: React.FC<MobilePlayerProps> = ({ media }) => {
  const [activeServerId, setActiveServerId] = useState(EMBED_SERVERS[0].id);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [seasons, setSeasons] = useState<Array<{ season_number: number; episode_count: number; name: string }>>([
    { season_number: 1, episode_count: 10, name: 'Season 1' },
  ]);
  const [episodes, setEpisodes] = useState<Array<{ episode_number: number; name: string }>>(() =>
    Array.from({ length: 10 }).map((_, i) => ({ episode_number: i + 1, name: `Episode ${i + 1}` }))
  );
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const currentServer = EMBED_SERVERS.find((s) => s.id === activeServerId) || EMBED_SERVERS[0];
  const embedUrl = currentServer.getUrl(media.media_type, media.id, season, episode);

  useEffect(() => {
    storageService.isInWatchlist(media.id).then(setIsInWatchlist);
    storageService.saveProgress(media, 120, 7200, season, episode);
  }, [media, season, episode]);

  useEffect(() => {
    if (media.media_type === 'tv') {
      tmdbService.getTVShowDetails(media.id).then((showData) => {
        if (showData?.seasons && Array.isArray(showData.seasons)) {
          const validSeasons = showData.seasons.filter((s: any) => s.season_number > 0);
          if (validSeasons.length > 0) {
            setSeasons(validSeasons);
          }
        }
      });
    }
  }, [media.id, media.media_type]);

  useEffect(() => {
    if (media.media_type === 'anime') {
      const epCount = media.episodes_count || 12;
      setEpisodes(
        Array.from({ length: epCount }).map((_, i) => ({ episode_number: i + 1, name: `Episode ${i + 1}` }))
      );
    } else if (media.media_type === 'tv') {
      setLoadingEpisodes(true);
      tmdbService.getTVSeasonDetails(media.id, season).then((seasonData) => {
        setLoadingEpisodes(false);
        if (seasonData?.episodes && Array.isArray(seasonData.episodes) && seasonData.episodes.length > 0) {
          setEpisodes(seasonData.episodes);
        } else {
          const currentSeasonObj = seasons.find((s) => s.season_number === season);
          const count = currentSeasonObj?.episode_count || 10;
          setEpisodes(
            Array.from({ length: count }).map((_, i) => ({ episode_number: i + 1, name: `Episode ${i + 1}` }))
          );
        }
      });
    }
  }, [media.id, media.media_type, media.episodes_count, season]);


  const handleServerSwitch = (serverId: string) => {
    setActiveServerId(serverId);
    setLoading(true);
    setHasError(false);
  };

  const triggerAutoFallback = () => {
    const currentIndex = EMBED_SERVERS.findIndex((s) => s.id === activeServerId);
    const nextIndex = (currentIndex + 1) % EMBED_SERVERS.length;
    setActiveServerId(EMBED_SERVERS[nextIndex].id);
    setLoading(true);
    setHasError(false);
  };

  const toggleFullscreen = async () => {
    try {
      if (typeof document !== 'undefined') {
        if (!document.fullscreenElement && document.documentElement) {
          await document.documentElement.requestFullscreen();
          if ('screen' in window && 'orientation' in screen && 'lock' in (screen as any).orientation) {
            await (screen as any).orientation.lock('landscape').catch(() => {});
          }
        } else if (document.fullscreenElement) {
          await document.exitFullscreen();
          if ('screen' in window && 'orientation' in screen && 'unlock' in (screen as any).orientation) {
            try {
              (screen as any).orientation.unlock();
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.warn('Fullscreen request skipped or not allowed:', err);
    }
  };



  const toggleWatchlist = async () => {
    if (isInWatchlist) {
      await storageService.removeFromWatchlist(media.id);
      setIsInWatchlist(false);
    } else {
      await storageService.addToWatchlist(media);
      setIsInWatchlist(true);
    }
  };


  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {media.title}
          </Text>
          <Text style={styles.subtitle}>
            {media.genres.join(' • ')} | {media.quality || 'HD'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={toggleWatchlist}
          style={[styles.bookmarkBtn, isInWatchlist && styles.bookmarkActive]}
        >
          <Ionicons
            name={isInWatchlist ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={isInWatchlist ? '#10b981' : '#ffffff'}
          />
        </TouchableOpacity>
      </View>

      {/* Multi-Server Selector Chips */}
      <View style={styles.serverRow}>
        <Text style={styles.serverLabel}>SERVERS:</Text>
        {EMBED_SERVERS.map((server) => {
          const isActive = server.id === activeServerId;
          return (
            <TouchableOpacity
              key={server.id}
              onPress={() => handleServerSwitch(server.id)}
              style={[styles.serverChip, isActive && styles.serverChipActive]}
            >
              <Text style={[styles.serverChipText, isActive && styles.serverChipTextActive]}>
                {server.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Embedded Fullscreen Video Player Container */}
      <View style={styles.playerContainer}>
        {hasError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={40} color="#e50914" />
            <Text style={styles.errorTitle}>Playback Error</Text>
            <Text style={styles.errorSubtitle}>
              Server ({currentServer.name}) unavailable. Try fallback mirror.
            </Text>
            <TouchableOpacity onPress={triggerAutoFallback} style={styles.fallbackButton}>
              <Ionicons name="refresh" size={16} color="#ffffff" />
              <Text style={styles.fallbackText}>Switch Server</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {loading && (
              <View style={styles.loadingOverlay} pointerEvents="none">
                <ActivityIndicator size="large" color="#e50914" />
                <Text style={styles.loadingText}>Connecting to {currentServer.name}...</Text>
              </View>
            )}

            {Platform.OS === 'web' ? (

              <iframe
                key={embedUrl}
                src={embedUrl}
                style={{ width: '100%', height: '100%', border: 0, pointerEvents: 'auto' }}
                allowFullScreen={true}
                allow="autoplay; fullscreen *; picture-in-picture; encrypted-media; gyroscope; accelerometer"
                {...({ webkitallowfullscreen: 'true', mozallowfullscreen: 'true' } as any)}
                referrerPolicy="no-referrer"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setHasError(true);
                }}
              />













            ) : (
              <WebView
                source={{ uri: embedUrl }}
                style={styles.webview}
                injectedJavaScript={adBlockScript}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setHasError(true);
                }}
                allowsFullscreenVideo
                javaScriptEnabled
                domStorageEnabled
                allowsInlineMediaPlayback
              />
            )}


          </>
        )}
      </View>

      {/* TV Series / Anime Season & Episode Selection */}
      {(media.media_type === 'tv' || media.media_type === 'anime') && (
        <View style={styles.tvSection}>
          <View style={styles.tvHeader}>
            <Text style={styles.tvTitle}>EPISODES ({episodes.length})</Text>
            <View style={styles.seasonRow}>
              <Text style={styles.seasonLabel}>Season:</Text>
              {seasons.map((s) => (
                <TouchableOpacity
                  key={s.season_number}
                  onPress={() => {
                    setSeason(s.season_number);
                    setEpisode(1);
                  }}
                  style={[styles.seasonChip, season === s.season_number && styles.seasonChipActive]}
                >
                  <Text style={[styles.seasonText, season === s.season_number && styles.seasonTextActive]}>
                    S{s.season_number}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {loadingEpisodes ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#e50914" />
            </View>
          ) : (
            <View style={styles.epGrid}>
              {episodes.map((ep) => {
                const epNum = ep.episode_number;
                const isActive = episode === epNum;
                return (
                  <TouchableOpacity
                    key={epNum}
                    onPress={() => {
                      setEpisode(epNum);
                      setHasError(false);
                      setLoading(true);
                    }}
                    style={[styles.epChip, isActive && styles.epChipActive]}
                  >
                    <Text style={[styles.epText, isActive && styles.epTextActive]}>EP {epNum}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    gap: 12,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181f',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  bookmarkBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  bookmarkActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serverLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '800',
    marginRight: 4,
  },
  serverChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#18181f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  serverChipActive: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  serverChipText: {
    color: '#d1d5db',
    fontSize: 11,
    fontWeight: '600',
  },
  serverChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 15, 18, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: 8,
  },

  loadingText: {
    color: '#d1d5db',
    fontSize: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  errorSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
  },
  fallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e50914',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  fallbackText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  tvSection: {
    backgroundColor: '#18181f',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  tvHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tvTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  seasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seasonLabel: {
    color: '#9ca3af',
    fontSize: 10,
  },
  seasonChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#0f0f12',
  },
  seasonChipActive: {
    backgroundColor: '#e50914',
  },
  seasonText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '700',
  },
  seasonTextActive: {
    color: '#ffffff',
  },
  epGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  epChip: {
    width: '18%',
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#0f0f12',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  epChipActive: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  epText: {
    color: '#d1d5db',
    fontSize: 10,
    fontWeight: '700',
  },
  epTextActive: {
    color: '#ffffff',
  },
});
