'use client';

import React, { useState, useEffect } from 'react';
import { Server, AlertTriangle, RefreshCw, Bookmark, Check, ShieldAlert, Tv } from 'lucide-react';
import { MediaItem } from '../../types/media';
import { storageService } from '../../lib/storage';
import { tmdbService } from '../../lib/tmdb';

export interface ServerOption {
  id: string;
  name: string;
  badge: string;
  getUrl: (type: 'movie' | 'tv', id: string | number, season: number, episode: number) => string;
}

export const SERVERS: ServerOption[] = [
  {
    id: 'videasy',
    name: 'Videasy',
    badge: 'Server 1 (Primary HD)',
    getUrl: (type, id, season = 1, episode = 1) =>
      type === 'tv'
        ? `https://player.videasy.net/tv/${id}/${season}/${episode}?sub=en`
        : `https://player.videasy.net/movie/${id}?sub=en`,
  },
  {
    id: 'embedmaster',
    name: 'Embed Master',
    badge: 'Server 2 (Fast Mirror)',
    getUrl: (type, id, season = 1, episode = 1) =>
      type === 'tv'
        ? `https://embedmaster.link/tv/${id}/${season}/${episode}?ds_lang=en`
        : `https://embedmaster.link/movie/${id}?ds_lang=en`,
  },
  {
    id: 'flmu',
    name: 'embed.filmu.in',
    badge: 'Server 3 (Multi-Audio)',
    getUrl: (type, id, season = 1, episode = 1) =>
      type === 'tv'
        ? `https://embed.filmu.in/tv/${id}/${season}/${episode}`
        : `https://embed.filmu.in/movie/${id}`,
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
  const [activeServerIndex, setActiveServerIndex] = useState(0);
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

  const currentServer = SERVERS[activeServerIndex] || SERVERS[0];
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
    if (media.media_type === 'tv') {
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
  }, [media.id, media.media_type, season]);

  const handleServerSwitch = (index: number) => {
    setActiveServerIndex(index);
    setHasError(false);
    setIsLoading(true);
  };

  const triggerAutoFallback = () => {
    const nextIndex = (activeServerIndex + 1) % SERVERS.length;
    setActiveServerIndex(nextIndex);
    setHasError(false);
    setIsLoading(true);
  };

  const playerRef = React.useRef<HTMLDivElement>(null);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && playerRef.current) {
        await playerRef.current.requestFullscreen();
        if (typeof window !== 'undefined' && 'screen' in window && 'orientation' in screen && 'lock' in (screen as any).orientation) {
          await (screen as any).orientation.lock('landscape').catch(() => {});
        }
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        if (typeof window !== 'undefined' && 'screen' in window && 'orientation' in screen && 'unlock' in (screen as any).orientation) {
          try {
            (screen as any).orientation.unlock();
          } catch (e) {}
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Player Top Navigation & Server Switcher Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#18181f] p-4 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2 tracking-wide">
            {media.title}
            {media.media_type === 'tv' && (
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
            {SERVERS.map((server, idx) => {
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

      {/* Responsive Iframe Video Player Container with Sandbox & Ad Mitigation */}
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
              allow="autoplay; fullscreen *; picture-in-picture; encrypted-media; gyroscope; accelerometer"
              {...({ webkitallowfullscreen: 'true', mozallowfullscreen: 'true' } as any)}
              referrerPolicy="no-referrer"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          </>
        )}
      </div>











      {/* TV Series Season & Episode Controls */}
      {media.media_type === 'tv' && (
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
