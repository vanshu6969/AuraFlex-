'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Server, AlertTriangle, RefreshCw, Bookmark, Check, ShieldAlert, Tv, Play } from 'lucide-react';
import { MediaItem } from '../../types/media';
import { storageService } from '../../lib/storage';
import { tmdbService } from '../../lib/tmdb';
import { isKdramaOrCdrama, isPunjabiMedia, isAnimeMedia } from '../../lib/mediaData';
import { kisskhService } from '../../lib/kisskh';

export interface ServerOption {
  id: string;
  name: string;
  badge: string;
  getUrl: (type: 'movie' | 'tv' | 'anime', id: string | number, season?: number, episode?: number, anilistId?: number | null) => string;
}

const SUB_FLAGS = 'sub=en&sub_lang=en&ds_lang=en&subtitles=1&cc_load_policy=1&auto_sub=1&sub_auto=1&default_sub=en&caption=en';

export const SERVERS: ServerOption[] = [
  {
    id: 'videasy',
    name: 'HD',
    badge: 'Server 1 (Primary HD)',
    getUrl: (type, id, season = 1, episode = 1) =>
      type === 'tv' || type === 'anime'
        ? `https://player.videasy.net/tv/${id}/${season}/${episode}?${SUB_FLAGS}`
        : `https://player.videasy.net/movie/${id}?${SUB_FLAGS}`,
  },
  {
    id: 'embedmaster',
    name: 'English',
    badge: 'Server 2 (English HD)',
    getUrl: (type, id, season = 1, episode = 1) =>
      type === 'tv' || type === 'anime'
        ? `https://vidsrc.icu/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.icu/embed/movie/${id}`,
  },
  {
    id: 'flmu',
    name: 'Indian',
    badge: 'Server 3 (Multi-Audio)',
    getUrl: (type, id, season = 1, episode = 1) =>
      type === 'tv' || type === 'anime'
        ? `https://embed.filmu.in/tv/${id}/${season}/${episode}?${SUB_FLAGS}`
        : `https://embed.filmu.in/movie/${id}?${SUB_FLAGS}`,
  },
  {
    id: 'anime',
    name: 'Anime',
    badge: 'Anime Server (HD)',
    getUrl: (type, id, season = 1, episode = 1) =>
      type === 'movie'
        ? `https://vidsrc.icu/embed/movie/${id}`
        : `https://vidsrc.icu/embed/tv/${id}/${season}/${episode}`,
  },
  {
    id: 'nontongo',
    name: 'KDrama',
    badge: 'KDrama & CDrama Server',
    getUrl: (type, id, season = 1, episode = 1) =>
      type === 'tv' || type === 'anime'
        ? `https://www.nontongo.win/embed/tv/${id}/${season}/${episode}?${SUB_FLAGS}`
        : `https://www.nontongo.win/embed/movie/${id}?${SUB_FLAGS}`,
  },
  {
    id: 'kisskh',
    name: 'KissKH',
    badge: 'KissKH Asian Server',
    getUrl: (type, id, season = 1, episode = 1) =>
      `https://kisskh.co/ExternalEmbed?id=${id}&sub=en`,
  },
];

interface VideoPlayerProps {
  media: MediaItem;
  initialSeason?: number;
  initialEpisode?: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  media,
  initialSeason = 1,
  initialEpisode = 1,
}) => {
  const isPunjabi = isPunjabiMedia(media);
  const isKdrama = isKdramaOrCdrama(media);
  const isAnime = isAnimeMedia(media);
  const isSeries = media.media_type === 'tv' || (media.media_type === 'anime' && (media.episodes_count || 0) > 1);

  const [anilistId, setAnilistId] = useState<number | null>(null);
  const [kisskhEmbedUrl, setKisskhEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (media.title && media.media_type === 'anime') {
      tmdbService.getAniListId(media.title).then((id) => {
        if (id) setAnilistId(id);
      });
    }
  }, [media.title, media.media_type]);

  useEffect(() => {
    if (isKdrama && media.title) {
      kisskhService.getKissKHEmbedUrl(media.title, initialEpisode).then((url) => {
        if (url) setKisskhEmbedUrl(url);
      });
    }
  }, [isKdrama, media.title, initialEpisode]);

  const availableServers = isPunjabi
    ? SERVERS.filter((s) => s.id === 'flmu')
    : isKdrama
    ? SERVERS.filter((s) => s.id === 'nontongo' || s.id === 'kisskh')
    : isAnime
    ? SERVERS.filter((s) => s.id === 'anime')
    : SERVERS.filter((s) => s.id !== 'nontongo' && s.id !== 'anime' && s.id !== 'kisskh');

  const [activeServerIndex, setActiveServerIndex] = useState(() => {
    if (isKdrama) {
      const nontongoIdx = SERVERS.findIndex((s) => s.id === 'nontongo');
      if (nontongoIdx !== -1) return nontongoIdx;
    }
    if (isPunjabi) {
      const idx = SERVERS.findIndex((s) => s.id === 'flmu');
      if (idx !== -1) return idx;
    }
    if (isAnime) {
      const idx = SERVERS.findIndex((s) => s.id === 'anime');
      if (idx !== -1) return idx;
    }
    return 0;
  });

  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [seasons, setSeasons] = useState<Array<{ season_number: number; episode_count: number; name: string }>>([
    { season_number: 1, episode_count: 10, name: 'Season 1' },
  ]);
  const [episodes, setEpisodes] = useState<Array<{ episode_number: number; name: string }>>(() =>
    Array.from({ length: 10 }).map((_, i) => ({ episode_number: i + 1, name: `Episode ${i + 1}` }))
  );
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdShield, setShowAdShield] = useState(true);

  const getAbsoluteEpisodeNumber = (seasonNum: number, epNum: number) => {
    if (seasonNum <= 1) return epNum;
    let totalPrev = 0;
    for (const s of seasons) {
      if (s.season_number > 0 && s.season_number < seasonNum) {
        totalPrev += s.episode_count || 0;
      }
    }
    return totalPrev + epNum;
  };

  useEffect(() => {
    if (isKdrama && media.title) {
      kisskhService.getKissKHEmbedUrl(media.title, episode).then((url) => {
        if (url) setKisskhEmbedUrl(url);
      });
    }
  }, [isKdrama, media.title, episode]);

  useEffect(() => {
    if (isKdrama) {
      if (kisskhEmbedUrl) {
        const kissIdx = SERVERS.findIndex((s) => s.id === 'kisskh');
        if (kissIdx !== -1) setActiveServerIndex(kissIdx);
      } else {
        const idx = SERVERS.findIndex((s) => s.id === 'nontongo');
        if (idx !== -1) setActiveServerIndex(idx);
      }
    } else if (isPunjabi) {
      const idx = SERVERS.findIndex((s) => s.id === 'flmu');
      if (idx !== -1) {
        setActiveServerIndex(idx);
      }
    } else if (isAnime) {
      const idx = SERVERS.findIndex((s) => s.id === 'anime');
      if (idx !== -1) {
        setActiveServerIndex(idx);
      }
    } else {
      setActiveServerIndex(0);
    }
  }, [media, isPunjabi, isKdrama, isAnime, kisskhEmbedUrl]);

  const currentServer = SERVERS[activeServerIndex] || availableServers[0] || SERVERS[0];
  const episodeToPass = currentServer.id === 'anime' && isSeries && anilistId
    ? getAbsoluteEpisodeNumber(season, episode)
    : episode;

  const embedUrl =
    currentServer.id === 'kisskh' && kisskhEmbedUrl
      ? kisskhEmbedUrl
      : currentServer.getUrl(media.media_type, media.id, season, episodeToPass, anilistId);

  useEffect(() => {
    setShowAdShield(true);
  }, [embedUrl]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalOpen = window.open;
      window.open = function (url, target, features) {
        console.warn('Blocked popup ad call:', url);
        return null;
      };

      const handleBlur = () => {
        setTimeout(() => {
          try {
            window.focus();
          } catch (e) {}
        }, 10);
      };

      const handleGlobalClick = (e: MouseEvent) => {
        const path = e.composedPath ? e.composedPath() : [];
        for (const el of path) {
          if (el instanceof HTMLAnchorElement && el.target === '_blank') {
            const href = el.href || '';
            if (!href.includes(window.location.hostname)) {
              e.preventDefault();
              e.stopPropagation();
              console.warn('Blocked external link popup:', href);
              return false;
            }
          }
        }
      };

      window.addEventListener('blur', handleBlur);
      window.addEventListener('click', handleGlobalClick, true);

      return () => {
        window.open = originalOpen;
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('click', handleGlobalClick, true);
      };
    }
  }, []);

  useEffect(() => {
    storageService.isInWatchlist(media.id).then(setIsInWatchlist);
    storageService.saveProgress(media, 120, 7200, season, episode);
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
  }, [media.id, media.media_type, season, isSeries]);

  const handleServerSwitch = (index: number) => {
    setActiveServerIndex(index);
    setHasError(false);
    setIsLoading(true);
  };

  const triggerAutoFallback = () => {
    const nextIndex = (activeServerIndex + 1) % availableServers.length;
    const realIndex = SERVERS.findIndex((s) => s.id === availableServers[nextIndex].id);
    setActiveServerIndex(realIndex !== -1 ? realIndex : 0);
    setHasError(false);
    setIsLoading(true);
  };

  const playerRef = useRef<HTMLDivElement>(null);

  const toggleWatchlist = async () => {
    if (isInWatchlist) {
      await storageService.removeFromWatchlist(media.id);
      setIsInWatchlist(false);
    } else {
      await storageService.addToWatchlist(media);
      setIsInWatchlist(true);
    }
  };

  const handleShieldClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAdShield(false);
    setTimeout(() => {
      setShowAdShield(true);
    }, 4000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Player Top Navigation & Server Switcher Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#18181f] p-4 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2 tracking-wide">
            {media.title}
            {isSeries && (
              <span className="text-xs font-bold text-primary bg-primary/20 border border-primary/40 px-2.5 py-0.5 rounded-full">
                S{season} E{episode}
              </span>
            )}
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1 flex items-center gap-2">
            <span>{media.genres.join(' • ')}</span>
            <span className="text-gray-600">•</span>
            <span className="text-primary font-bold">{media.quality || '4K Ultra HD'}</span>
          </p>
        </div>

        {/* Server Selection Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 mr-2">
            <Server className="w-4 h-4 text-primary" />
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Servers:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {availableServers.map((server) => {
              const idx = SERVERS.findIndex((s) => s.id === server.id);
              const isActive = idx === activeServerIndex;
              return (
                <button
                  key={server.id}
                  onClick={() => handleServerSwitch(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-primary text-white border-primary shadow-glow-crimson scale-105'
                      : 'bg-[#0f0f12] text-gray-300 border-white/10 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <span>{server.name}</span>
                </button>
              );
            })}
          </div>

          {/* Watchlist Toggle */}
          <button
            onClick={toggleWatchlist}
            className={`p-2.5 rounded-xl border text-xs font-semibold ml-auto lg:ml-2 transition-all duration-200 ${
              isInWatchlist
                ? 'bg-emerald-600/30 border-emerald-500 text-emerald-400'
                : 'bg-[#0f0f12] border-white/10 text-gray-300 hover:text-white hover:border-white/30'
            }`}
            title="Add to Watchlist"
          >
            {isInWatchlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Responsive Iframe Video Player Container */}
      <div ref={playerRef} className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#18181f]/95 space-y-4 z-20">
            <AlertTriangle className="w-12 h-12 text-primary animate-bounce" />
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Server Connection Interrupted</h3>
              <p className="text-gray-400 text-xs sm:text-sm max-w-md">
                Unable to load stream on <span className="text-white font-semibold">{currentServer.name}</span>.
                Switch to an alternative backup mirror.
              </p>
            </div>
            <button
              onClick={triggerAutoFallback}
              className="flex items-center gap-2 bg-primary hover:bg-red-600 text-white font-bold px-6 py-3 rounded-xl shadow-glow-crimson transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4 animate-spin" /> Switch to Backup Server
            </button>
          </div>
        ) : (
          <>
            <iframe
              key={embedUrl}
              src={embedUrl}
              className="w-full h-full border-0 rounded-xl bg-black pointer-events-auto"
              allowFullScreen={true}
              allow="autoplay; fullscreen *; picture-in-picture; encrypted-media; accelerometer; gyroscope"
              referrerPolicy="origin"
              {...({ webkitallowfullscreen: 'true', mozallowfullscreen: 'true' } as any)}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          </>
        )}
      </div>

      {/* TV Series & Anime Series Season & Episode Controls (Hidden for Movies) */}
      {isSeries && (
        <div className="bg-[#18181f] p-4 rounded-2xl border border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Tv className="w-4 h-4 text-primary" /> Season & Episode Selector ({episodes.length} Episodes)
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-semibold">Select Season:</span>
              <select
                value={season}
                onChange={(e) => {
                  setSeason(Number(e.target.value));
                  setEpisode(1);
                }}
                className="bg-[#0f0f12] text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-primary"
              >
                {seasons.map((s) => (
                  <option key={s.season_number} value={s.season_number}>
                    {s.name || `Season ${s.season_number}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingEpisodes ? (
            <div className="py-6 text-center text-gray-400 text-xs font-semibold">
              Loading TMDB Season Episodes...
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2 pt-1">
              {episodes.map((ep) => {
                const epNum = ep.episode_number;
                const isActive = episode === epNum;
                return (
                  <button
                    key={epNum}
                    onClick={() => {
                      setEpisode(epNum);
                      setHasError(false);
                      setIsLoading(true);
                    }}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-white border-primary shadow-glow-crimson scale-105'
                        : 'bg-[#0f0f12] text-gray-300 border-white/10 hover:border-white/30'
                    }`}
                  >
                    EP {epNum}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
