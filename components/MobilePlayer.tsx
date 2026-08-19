import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Alert } from 'react-native';

import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { MediaItem } from '../types/media';

import { EMBED_SERVERS, isKdramaOrCdrama, isPunjabiMedia, isAnimeMedia } from '../lib/mediaData';
import { storageService } from '../lib/storage';
import { showToast } from '../lib/toast';
import { tmdbService } from '../lib/tmdb';

import { ReportRequestModal } from './ReportRequestModal';
import { YouTubePlayer } from './YouTubePlayer';
import { EpisodeSlider } from './EpisodeSlider';


interface MobilePlayerProps {


  media: MediaItem;
  season?: number;
  episode?: number;
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

export const MobilePlayer: React.FC<MobilePlayerProps> = ({ media, season: initialSeason = 1, episode: initialEpisode = 1 }) => {
  const isPunjabi = isPunjabiMedia(media);
  const isKdrama = isKdramaOrCdrama(media);
  const isAnime = isAnimeMedia(media);
  const isSeries = media.media_type === 'tv' || (media.media_type === 'anime' && (media.episodes_count || 0) > 1);

  const availableServers = isPunjabi
    ? EMBED_SERVERS.filter((s) => s.id === 'videasy' || s.id === 'embedmaster' || s.id === 'flmu' || s.id === 'youtube')
    : isKdrama
    ? EMBED_SERVERS.filter((s) => s.id === 'videasy' || s.id === 'nontongo' || s.id === 'youtube')
    : isAnime
    ? EMBED_SERVERS.filter((s) => s.id === 'anime' || s.id === 'videasy')
    : EMBED_SERVERS.filter((s) => s.id !== 'nontongo' && s.id !== 'anime');

  const [activeServerId, setActiveServerId] = useState(() => 'videasy');


  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);

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
  const [showAdShield, setShowAdShield] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);


  const [anilistId, setAnilistId] = useState<number | null>(null);

  useEffect(() => {
    if (media.title) {
      tmdbService.getAniListId(media.title).then((id) => {
        if (id) setAnilistId(id);
      });
    }
  }, [media.title]);

  const currentServer = EMBED_SERVERS.find((s) => s.id === activeServerId) || availableServers[0] || EMBED_SERVERS[0];
  const embedUrl = activeServerId === 'youtube'
    ? 'about:blank'
    : currentServer.getUrl(media.media_type, media.id, season, episode, anilistId);

  useEffect(() => {
    setLoading(true);
    setShowAdShield(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, [embedUrl]);

  const handleShieldClick = (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    setShowAdShield(false);
    setTimeout(() => {
      setShowAdShield(true);
    }, 2500);
  };

  // Restore watch state & preferred server on mount / media change
  useEffect(() => {
    let isMounted = true;
    const restoreState = async () => {
      try {
        const savedState = await storageService.getMediaWatchState(media.id);
        const preferredServer = await storageService.getPreferredServer();

        if (!isMounted) return;

        if (savedState) {
          if (savedState.season) setSeason(savedState.season);
          if (savedState.episode) setEpisode(savedState.episode);
          if (savedState.serverId && availableServers.some((s) => s.id === savedState.serverId)) {
            setActiveServerId(savedState.serverId);
            return;
          }
        }

        if (preferredServer && availableServers.some((s) => s.id === preferredServer)) {
          setActiveServerId(preferredServer);
        } else if (isPunjabi) {
          setActiveServerId('flmu');
        } else if (isKdrama) {
          setActiveServerId('nontongo');
        } else if (isAnime) {
          setActiveServerId('anime');
        } else {
          setActiveServerId('videasy');
        }
      } catch (e) {}
    };

    restoreState();

    return () => {
      isMounted = false;
    };
  }, [media.id, isPunjabi, isKdrama, isAnime]);

  // Persist watch state & preferred server on change
  useEffect(() => {
    if (media.id) {
      storageService.saveMediaWatchState(media.id, { season, episode, serverId: activeServerId });
      storageService.setPreferredServer(activeServerId);
      storageService.saveProgress(media, 0, 0, season, episode);
    }
  }, [media.id, season, episode, activeServerId]);

  // Keyboard Shortcuts (Web Desktop View)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === ' ' || key === 'k') {
        e.preventDefault();
        showToast('Playback Toggled (Space/K)', 'info');
      } else if (key === 'f') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
          showToast('Entered Fullscreen (F)', 'info');
        } else {
          document.exitFullscreen?.().catch(() => {});
          showToast('Exited Fullscreen (F)', 'info');
        }
      } else if (key === 'm') {
        e.preventDefault();
        showToast('Audio Mute Toggled (M)', 'info');
      } else if (key === 'arrowleft') {
        e.preventDefault();
        showToast('Seek -10s Backward (←)', 'info');
      } else if (key === 'arrowright') {
        e.preventDefault();
        showToast('Seek +10s Forward (→)', 'info');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  useEffect(() => {
    storageService.isInWatchlist(media.id).then(setIsInWatchlist);

    // Initialize watch progress
    storageService.getContinueWatching().then((list) => {
      const existing = list.find((item) => String(item.mediaId) === String(media.id));
      const initialTime = existing ? existing.currentTime : 180;
      storageService.saveProgress(media, initialTime, 7200, season, episode);
    });

    const timer = setInterval(() => {
      storageService.getContinueWatching().then((list) => {
        const existing = list.find((item) => String(item.mediaId) === String(media.id));
        const prevTime = existing ? existing.currentTime : 180;
        const newTime = Math.min(7200, prevTime + 15);
        storageService.saveProgress(media, newTime, 7200, season, episode);
      });
    }, 15000);

    return () => clearInterval(timer);
  }, [media, season, episode]);

  useEffect(() => {
    if (isSeries) {
      tmdbService.getTVShowDetails(media.id).then((showData) => {
        if (showData?.seasons && Array.isArray(showData.seasons)) {
          const validSeasons = showData.seasons.filter((s: any) => s.season_number > 0);
          if (validSeasons.length > 0) {
            setSeasons(validSeasons);
          }
        }
      });
    }
  }, [media.id, media.media_type, isSeries]);

  useEffect(() => {
    if (isSeries) {
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
  }, [media.id, media.media_type, isSeries, season]);

  const handleServerSwitch = (serverId: string) => {
    setActiveServerId(serverId);
    setLoading(true);
    setHasError(false);
    const targetServer = EMBED_SERVERS.find((s) => s.id === serverId);
    showToast(`Switched to ${targetServer?.badge || serverId}`, 'info');
  };

  const triggerAutoFallback = () => {
    const currentIndex = EMBED_SERVERS.findIndex((s) => s.id === activeServerId);
    const nextIndex = (currentIndex + 1) % EMBED_SERVERS.length;
    setActiveServerId(EMBED_SERVERS[nextIndex].id);
    setLoading(true);
    setHasError(false);
    showToast(`Auto-switching to ${EMBED_SERVERS[nextIndex].badge}`, 'info');
  };

  const toggleWatchlist = async () => {
    if (isInWatchlist) {
      await storageService.removeFromWatchlist(media.id);
      setIsInWatchlist(false);
      showToast('Removed from Watchlist', 'info');
    } else {
      await storageService.addToWatchlist(media);
      setIsInWatchlist(true);
      showToast('Added to Watchlist', 'success');
    }
  };


  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {media.title} {isSeries ? `• S${season} E${episode}` : ''}
          </Text>
          <Text style={styles.subtitle}>
            {media.genres.join(' • ')} | {media.quality || 'HD'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            onPress={() => setShowReportModal(true)}
            style={styles.actionBtnHeader}
          >
            <Ionicons name="flag-outline" size={16} color="#ef4444" />
          </TouchableOpacity>

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
      </View>


      {/* Multi-Server Selector Chips */}
      <View style={styles.serverRow}>
        <Text style={styles.serverLabel}>SERVERS:</Text>
        {availableServers.map((server) => {
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
              Server ({currentServer.name}) unavailable. Try fallback mirror or report broken link.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TouchableOpacity onPress={triggerAutoFallback} style={styles.fallbackButton}>
                <Ionicons name="refresh" size={16} color="#ffffff" />
                <Text style={styles.fallbackText}>Switch Server</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowReportModal(true)} style={[styles.fallbackButton, { backgroundColor: '#374151' }]}>
                <Ionicons name="flag" size={16} color="#ef4444" />
                <Text style={styles.fallbackText}>Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {activeServerId === 'youtube' ? (
              <YouTubePlayer
                media={media}
                season={season}
                episode={episode}
                isSeries={isSeries}
                onSwitchServer={triggerAutoFallback}
              />
            ) : (
              <>
                {loading && (
                  <View style={[styles.loadingOverlay, { pointerEvents: 'none' }]}>
                    <ActivityIndicator size="large" color="#e50914" />

                    <Text style={styles.loadingText}>Connecting to {currentServer.name}...</Text>
                  </View>
                )}

                {Platform.OS === 'web' ? (
                  <View style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
                    {showAdShield && (
                      <TouchableOpacity
                        activeOpacity={1}
                        onPress={handleShieldClick}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 10,
                          backgroundColor: 'rgba(0, 0, 0, 0.01)',
                        }}
                      />
                    )}
                    <iframe
                      key={embedUrl}
                      src={embedUrl}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        backgroundColor: '#000',
                      }}
                      allowFullScreen={true}
                      allow="autoplay; fullscreen *; picture-in-picture; encrypted-media"
                    />
                  </View>
                ) : (
                  <WebView
                    key={embedUrl}
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
          </>
        )}
      </View>

      {/* TV Series / Anime Series Season & Episode Selector Slider */}
      {isSeries && (
        <EpisodeSlider
          tmdbId={media.id}
          currentSeason={season}
          currentEpisode={episode}
          onSelectEpisode={(s, e) => {
            setSeason(s);
            setEpisode(e);
            setHasError(false);
            setLoading(true);
          }}
        />
      )}


      {/* Report Broken Link Modal */}
      <ReportRequestModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        initialTab="report"
        prefilledMediaTitle={media.title}
        prefilledMediaId={String(media.id)}
      />
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
    borderRadius: 14,
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
    fontWeight: '500',
    marginTop: 2,
  },
  actionBtnHeader: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  bookmarkBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0f0f12',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bookmarkActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  downloadServerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e50914',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
    marginLeft: 'auto',
  },
  downloadServerChipText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },

  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  serverLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
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
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
  },
  serverChipTextActive: {
    color: '#ffffff',
  },
  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    borderRadius: 16,
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
    backgroundColor: '#18181f',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    gap: 8,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#18181f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  },
  fallbackText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  tvSection: {
    backgroundColor: '#18181f',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  tvHeader: {
    gap: 8,
  },
  tvTitle: {
    color: '#e50914',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  seasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  seasonLabel: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  seasonChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#0f0f12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  seasonChipActive: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  seasonText: {
    color: '#9ca3af',
    fontSize: 11,
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
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0f0f12',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  epChipActive: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  epText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
  },
  epTextActive: {
    color: '#ffffff',
  },
});
