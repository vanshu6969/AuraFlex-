import { MediaItem } from '../types/media';

const ANILIST_URL = 'https://graphql.anilist.co';

export interface AniListMedia {
  id: number;
  title: {
    english?: string;
    romaji?: string;
    native?: string;
  };
  coverImage?: {
    extraLarge?: string;
    large?: string;
    medium?: string;
  };
  bannerImage?: string;
  description?: string;
  episodes?: number;
  averageScore?: number;
  genres?: string[];
  format?: string;
}

export const mapAniListToMediaItem = (anime: AniListMedia): MediaItem => {
  const displayTitle = anime.title?.english || anime.title?.romaji || 'Anime';
  const cleanOverview = anime.description
    ? anime.description.replace(/<[^>]*>?/gm, '')
    : 'No description available.';
  const poster = anime.coverImage?.extraLarge || anime.coverImage?.large || anime.coverImage?.medium || '';
  const backdrop = anime.bannerImage || poster;
  const rating = anime.averageScore ? Number((anime.averageScore / 10).toFixed(1)) : 8.0;

  return {
    id: anime.id,
    title: displayTitle,
    overview: cleanOverview,
    poster_path: poster,
    backdrop_path: backdrop,
    media_type: 'anime',
    vote_average: Math.min(10, Math.max(0, rating)),
    genres: anime.genres && anime.genres.length > 0 ? anime.genres : ['Anime'],
    duration: anime.episodes ? `${anime.episodes} Episodes` : 'Ongoing',
    quality: 'HD Anime',
  };
};

export const fetchTrendingAnime = async (): Promise<AniListMedia[]> => {
  const query = `
    query {
      Page(page: 1, perPage: 20) {
        media(type: ANIME, sort: TRENDING_DESC) {
          id
          title { english romaji native }
          coverImage { extraLarge large medium }
          bannerImage
          description
          episodes
          averageScore
          genres
          format
        }
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    return data?.data?.Page?.media || [];
  } catch (err) {
    console.error('Error fetching trending anime:', err);
    return [];
  }
};

export const searchAnime = async (searchQuery: string): Promise<AniListMedia[]> => {
  if (!searchQuery.trim()) return [];
  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 20) {
        media(type: ANIME, search: $search, sort: POPULARITY_DESC) {
          id
          title { english romaji native }
          coverImage { extraLarge large medium }
          bannerImage
          description
          episodes
          averageScore
          genres
          format
        }
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { search: searchQuery } }),
    });
    const data = await res.json();
    return data?.data?.Page?.media || [];
  } catch (err) {
    console.error('Error searching anime:', err);
    return [];
  }
};

export const getAnimeDetails = async (id: number): Promise<AniListMedia | null> => {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { english romaji native }
        coverImage { extraLarge large medium }
        bannerImage
        description
        episodes
        averageScore
        genres
        format
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { id } }),
    });
    const data = await res.json();
    return data?.data?.Media || null;
  } catch (err) {
    console.error('Error fetching anime details:', err);
    return null;
  }
};
