import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MediaItem } from '../types/media';
import { DirectVideoPlayer } from './DirectVideoPlayer';
import {
  resolveYouTubeVideo,
  fetchDirectProxyStream,
  sanitizeYouTubeInput,
  openYouTubeVideo,
  openYouTubeSearch,
  openInvidiousProxy,
  ResolveYouTubeResult,
  DirectProxyStreamResult,
} from '../services/youtubeService';

interface YouTubePlayerProps {
  media: MediaItem;
  season?: number;
  episode?: number;
  isSeries?: boolean;
  onSwitchServer?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  media,
  season = 1,
  episode = 1,
  isSeries = false,
  onSwitchServer,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [videoInfo, setVideoInfo] = useState<ResolveYouTubeResult>({ videoId: null });
  const [proxyStream, setProxyStream] = useState<DirectProxyStreamResult | null>(null);
  const [manualVideoId, setManualVideoId] = useState<string | null>(null);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [embedDisabledError, setEmbedDisabledError] = useState<boolean>(false);

  // Custom Link Drawer State
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('');
  const [inputError, setInputError] = useState<string>('');

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<any>(null);

  const searchQuery = `${media.title} ${isSeries ? `Episode ${episode}` : 'Full Movie'}`;
  const activeVideoId = manualVideoId || videoInfo.videoId;

  // Primary Stream Resolution Loop
  const loadStream = async (skipList: string[] = []) => {
    setLoading(true);
    setEmbedDisabledError(false);
    setProxyStream(null);

    try {
      const baseUrl =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'https://auraflexmovies.vercel.app'
          : '';

      const queryParams = new URLSearchParams({
        title: media.title,
        season: season.toString(),
        episode: episode.toString(),
        type: media.media_type === 'tv' ? 'tv' : 'movie',
        ...(skipList.length > 0 ? { skipVideoId: skipList.join(',') } : {}),
      });

      // 1. Resolve candidate video ID
      const res = await resolveYouTubeVideo({
        title: media.title,
        season,
        episode,
        type: media.media_type === 'tv' ? 'tv' : 'movie',
      });

      let candidateId = res.videoId;

      // If candidate ID is in skip list, trigger fallback scraper
      if (candidateId && skipList.includes(candidateId)) {
        const fetchRes = await fetch(`${baseUrl}/api/yt-stream?${queryParams.toString()}`);
        if (fetchRes.ok) {
          const data = await fetchRes.json();
          candidateId = data.videoId || null;
        }
      }

      if (candidateId) {
        setVideoInfo({ videoId: candidateId, title: res.title, channel: res.channel });

        // Check direct proxy stream
        const proxyRes = await fetchDirectProxyStream(candidateId);
        if (proxyRes.success && proxyRes.directStreamUrl) {
          setProxyStream(proxyRes);
        }
      } else {
        setVideoInfo({ videoId: null });
      }
    } catch (err) {
      console.log('Error resolving YouTube stream:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSkippedIds([]);
    setManualVideoId(null);
    loadStream([]);
  }, [media.title, season, episode, isSeries]);

  // Handle Embed Restriction (Error Codes 150 / 101 / 100)
  const handleEmbedError = async (errCode: number) => {
    console.log(`YouTube Iframe Error Code detected: ${errCode}`);
    setEmbedDisabledError(true);

    if (activeVideoId && !skippedIds.includes(activeVideoId)) {
      const newSkipped = [...skippedIds, activeVideoId];
      setSkippedIds(newSkipped);

      // 1. Try Direct Proxy extraction for current video ID first
      const proxyRes = await fetchDirectProxyStream(activeVideoId);
      if (proxyRes.success && proxyRes.directStreamUrl) {
        setProxyStream(proxyRes);
        setEmbedDisabledError(false);
        return;
      }

      // 2. Waterfall to next search candidate
      loadStream(newSkipped);
    }
  };

  // YouTube IFrame API Initialization (Web)
  useEffect(() => {
    if (Platform.OS !== 'web' || !activeVideoId || proxyStream?.directStreamUrl) return;

    const initPlayer = () => {
      if (window.YT && window.YT.Player && iframeRef.current) {
        try {
          if (playerRef.current && typeof playerRef.current.destroy === 'function') {
            playerRef.current.destroy();
          }

          playerRef.current = new window.YT.Player(iframeRef.current, {
            events: {
              onError: (event: any) => {
                const code = event?.data;
                if (code === 150 || code === 101 || code === 100) {
                  handleEmbedError(code);
                }
              },
            },
          });
        } catch (e) {
          console.log('YT Player init error:', e);
        }
      }
    };

    // PostMessage listener for iframe embed events
    const handleWindowMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          if (data.event === 'onError' || (data.info && data.info.playerState === -1)) {
            const errCode = data.info?.errorCode || data.args?.[0];
            if (errCode === 150 || errCode === 101 || errCode === 100) {
              handleEmbedError(errCode);
            }
          }
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleWindowMessage);

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }

    return () => {
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [activeVideoId, proxyStream?.directStreamUrl]);

  const handleCustomSubmit = () => {
    if (!customInput.trim()) {
      setInputError('Please enter a valid YouTube URL or Video ID');
      return;
    }

    const parsedId = sanitizeYouTubeInput(customInput);
    if (!parsedId) {
      setInputError('Invalid YouTube link or Video ID. Example: https://youtu.be/0KMxQq5JQ7U');
      return;
    }

    setManualVideoId(parsedId);
    setInputError('');
    setShowDrawer(false);
    setCustomInput('');
  };

  const embedUrl = activeVideoId
    ? `https://www.youtube-nocookie.com/embed/${activeVideoId}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1`
    : null;

  return (
    <View style={styles.container}>
      {/* Animated Loading Skeleton */}
      {loading && (
        <View style={styles.skeletonOverlay}>
          <ActivityIndicator size="large" color="#e50914" />
          <Text style={styles.skeletonText}>
            Resolving stream for {media.title} {isSeries ? `Episode ${episode}` : ''}...
          </Text>
        </View>
      )}

      {/* Mode 1: Direct HTML5 Video Player (Proxy Stream Active) */}
      {!loading && proxyStream?.directStreamUrl ? (
        <DirectVideoPlayer
          streamUrl={proxyStream.directStreamUrl}
          mimeType={proxyStream.mimeType}
          title={videoInfo.title || media.title}
          subtitles={proxyStream.subtitles || []}
          onError={() => setProxyStream(null)}
        />
      ) : /* Mode 2: Standard YouTube IFrame Player API Embed */
      !loading && embedUrl && !embedDisabledError ? (
        <View style={styles.playerWrapper}>
          {Platform.OS === 'web' ? (
            <iframe
              ref={iframeRef}
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
          ) : (
            <View style={styles.mobileFallbackBox}>
              <Ionicons name="logo-youtube" size={56} color="#e50914" />
              <Text style={styles.mobileFallbackTitle}>{media.title}</Text>
              <TouchableOpacity
                onPress={() => activeVideoId && openYouTubeVideo(activeVideoId)}
                style={styles.primaryPlayBtn}
              >
                <Ionicons name="play" size={20} color="#ffffff" />
                <Text style={styles.primaryPlayBtnText}>Open & Watch Backup Stream</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* YouTube Video Player Embed */}
        </View>
      ) : null}

      {/* Fallback Screen */}
      {!loading && !activeVideoId ? (
        <View style={styles.fallbackContainer}>
          <Ionicons name="film-outline" size={48} color="#e50914" />
          <Text style={styles.fallbackTitle}>No Direct Video Stream Loaded</Text>
          <Text style={styles.fallbackSub}>
            {embedDisabledError
              ? 'The owner of this video has restricted third-party web playback. You can watch it directly or switch to another server.'
              : `No long-form video stream found for ${media.title}.`}
          </Text>


          <View style={styles.fallbackActions}>
            {activeVideoId && (
              <TouchableOpacity
                onPress={() => openYouTubeVideo(activeVideoId)}
                style={styles.primaryPlayBtn}
              >
                <Ionicons name="play-circle" size={18} color="#ffffff" />
                <Text style={styles.primaryPlayBtnText}>Watch Direct Stream</Text>
              </TouchableOpacity>
            )}

            {onSwitchServer && (
              <TouchableOpacity onPress={onSwitchServer} style={styles.secondaryBtn}>
                <Ionicons name="swap-horizontal" size={18} color="#38bdf8" />
                <Text style={styles.secondaryBtnText}>Switch to HD Mirror Server</Text>
              </TouchableOpacity>
            )}

            {activeVideoId && (
              <TouchableOpacity
                onPress={() => openInvidiousProxy(activeVideoId)}
                style={styles.darkOutlineBtn}
              >
                <Ionicons name="globe-outline" size={18} color="#38bdf8" />
                <Text style={styles.darkOutlineBtnText}>Open Web Proxy</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setShowDrawer(true)} style={styles.darkOutlineBtn}>
              <Ionicons name="create-outline" size={18} color="#a855f7" />
              <Text style={styles.darkOutlineBtnText}>Paste Custom Link / Video ID</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Custom Link Drawer Modal */}
      <Modal
        visible={showDrawer}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDrawer(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.drawerContent}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Supply Custom Stream Link</Text>
              <TouchableOpacity onPress={() => setShowDrawer(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <Text style={styles.drawerDesc}>
              Paste any video URL or Video ID to stream it directly.
            </Text>

            <TextInput
              style={styles.drawerInput}
              placeholder="e.g. https://youtu.be/0KMxQq5JQ7U"
              placeholderTextColor="#6b7280"
              value={customInput}
              onChangeText={(txt) => {
                setCustomInput(txt);
                setInputError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {inputError ? <Text style={styles.errorText}>{inputError}</Text> : null}

            <View style={styles.drawerBtnRow}>
              <TouchableOpacity onPress={() => setShowDrawer(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleCustomSubmit} style={styles.submitBtn}>
                <Text style={styles.submitBtnText}>Apply & Stream</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0a0a0d',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f0f13',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    gap: 12,
  },
  skeletonText: {
    color: '#e4e4e7',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  playerWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mobileFallbackBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 10,
  },
  mobileFallbackTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomControlBar: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(10, 10, 15, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlBtnText: {
    color: '#f4f4f5',
    fontSize: 12,
    fontWeight: '600',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  fallbackTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  fallbackSub: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  fallbackActions: {
    gap: 10,
    width: '100%',
    maxWidth: 340,
    marginTop: 8,
  },
  primaryPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e50914',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  primaryPlayBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  secondaryBtnText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '700',
  },
  darkOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#18181f',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  darkOutlineBtnText: {
    color: '#d1d5db',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  drawerContent: {
    backgroundColor: '#121217',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  drawerDesc: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
  },
  drawerInput: {
    backgroundColor: '#1f1f2e',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
  },
  drawerBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#27272a',
  },
  cancelBtnText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
    backgroundColor: '#e50914',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
