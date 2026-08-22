export interface MediaItem {
  id: number | string;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  media_type: 'movie' | 'tv' | 'anime';
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genres: string[];
  duration?: string;
  quality?: string;
  episodes_count?: number;
  origin_country?: string[];
  original_language?: string;
  season?: number;
  episode?: number;
  episode_title?: string;
  still_path?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WatchProgress {
  mediaId: number | string;
  media: MediaItem;
  season?: number;
  episode?: number;
  currentTime: number;
  duration: number;
  updatedAt: number;
}

export interface EmbedServer {
  id: string;
  name: string;
  badge: string;
  getUrl: (type: 'movie' | 'tv' | 'anime', id: number | string, season?: number, episode?: number, anilistId?: number | null) => string;
}
