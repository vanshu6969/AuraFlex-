import { MediaItem } from '../types/media';

import { MOCK_MEDIA_ITEMS } from './mediaData';

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '5f85fd51bf4325e76cad21aadfe1ecc6';
const TMDB_BASE_URL = process.env.EXPO_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = process.env.EXPO_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action',
  10762: 'Kids',
  10765: 'Sci-Fi',
  10768: 'War',
};

export const tmdbService = {
  formatMediaItem(raw: any, defaultType: 'movie' | 'tv' = 'movie'): MediaItem {
    const media_type = raw.media_type || defaultType;
    const title = raw.title || raw.name || raw.original_title || raw.original_name || 'Untitled';
    
    const poster_path = raw.poster_path
      ? `${IMAGE_BASE_URL}/w500${raw.poster_path}`
      : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';
      
    const backdrop_path = raw.backdrop_path
      ? `${IMAGE_BASE_URL}/w780${raw.backdrop_path}`
      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80';

    const genre_ids: number[] = raw.genre_ids || raw.genres?.map((g: any) => g.id) || [];
    const genres = genre_ids.map((id) => GENRE_MAP[id]).filter(Boolean);
    if (genres.length === 0 && raw.genres?.length) {
      genres.push(...raw.genres.map((g: any) => g.name));
    }
    if (genres.length === 0) genres.push(media_type === 'movie' ? 'Cinema' : 'Series');

    return {
      id: raw.id,
      title,
      overview: raw.overview || 'No overview available for this title.',
      poster_path,
      backdrop_path,
      media_type: media_type === 'tv' ? 'tv' : 'movie',
      release_date: raw.release_date,
      first_air_date: raw.first_air_date,
      vote_average: raw.vote_average ? Number(raw.vote_average) : 8.0,
      genres,
      quality: raw.vote_average > 8 ? '4K Ultra HD' : '1080p Full HD',
    };
  },

  async getTrending(): Promise<MediaItem[]> {
    try {
      const res = await fetch(`${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}&language=en-US`);
      if (!res.ok) throw new Error('Trending fetch error');
      const data = await res.json();
      return data.results.map((item: any) => this.formatMediaItem(item));
    } catch {
      return MOCK_MEDIA_ITEMS;
    }
  },

  async getPopularMovies(): Promise<MediaItem[]> {
    try {
      const res = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
      if (!res.ok) throw new Error('Popular movies fetch error');
      const data = await res.json();
      return data.results.map((item: any) => this.formatMediaItem(item, 'movie'));
    } catch {
      return MOCK_MEDIA_ITEMS.filter((item) => item.media_type === 'movie');
    }
  },

  async getTopTVShows(): Promise<MediaItem[]> {
    try {
      const res = await fetch(`${TMDB_BASE_URL}/tv/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
      if (!res.ok) throw new Error('Top TV shows fetch error');
      const data = await res.json();
      return data.results.map((item: any) => this.formatMediaItem(item, 'tv'));
    } catch {
      return MOCK_MEDIA_ITEMS.filter((item) => item.media_type === 'tv');
    }
  },

  async getRecentlyAdded(): Promise<MediaItem[]> {
    try {
      const res = await fetch(`${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
      if (!res.ok) throw new Error('Now playing fetch error');
      const data = await res.json();
      return data.results.map((item: any) => this.formatMediaItem(item, 'movie'));
    } catch {
      return [...MOCK_MEDIA_ITEMS].reverse();
    }
  },

  async getMediaDetails(id: string | number, type: 'movie' | 'tv' = 'movie'): Promise<MediaItem | null> {
    try {
      const res = await fetch(`${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=en-US`);
      if (!res.ok) throw new Error('Details fetch error');
      const data = await res.json();
      return this.formatMediaItem(data, type);
    } catch {
      const fallback = MOCK_MEDIA_ITEMS.find((m) => String(m.id) === String(id));
      return fallback || null;
    }
  },

  async searchMedia(query: string, type: string = 'all'): Promise<MediaItem[]> {
    if (!query.trim()) return [];

    try {
      const endpoint =
        type === 'movie'
          ? `${TMDB_BASE_URL}/search/movie`
          : type === 'tv'
          ? `${TMDB_BASE_URL}/search/tv`
          : `${TMDB_BASE_URL}/search/multi`;

      const res = await fetch(
        `${endpoint}?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`
      );
      if (!res.ok) throw new Error('Search error');
      const data = await res.json();

      return data.results
        .filter((item: any) => item.media_type !== 'person')
        .map((item: any) => this.formatMediaItem(item, type === 'tv' ? 'tv' : 'movie'));
    } catch {
      const q = query.toLowerCase();
      return MOCK_MEDIA_ITEMS.filter((item) => item.title.toLowerCase().includes(q));
    }
  },

  async getTVShowDetails(id: string | number): Promise<any | null> {

    try {
      const res = await fetch(`${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}&language=en-US`);
      if (!res.ok) throw new Error('TV show fetch error');
      return await res.json();
    } catch {
      return null;
    }
  },

  async getTVSeasonDetails(id: string | number, seasonNumber: number): Promise<any | null> {
    try {
      const res = await fetch(
        `${TMDB_BASE_URL}/tv/${id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=en-US`
      );
      if (!res.ok) throw new Error('Season fetch error');
      return await res.json();
    } catch {
      return null;
    }
  },
};

