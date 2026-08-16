import { EmbedServer, MediaItem } from '../types/media';

export const isKdramaOrCdrama = (item: MediaItem): boolean => {
  if (!item) return false;

  const originCountry = item.origin_country || [];
  const origLang = (item.original_language || '').toLowerCase();

  if (
    origLang === 'ko' ||
    origLang === 'zh' ||
    origLang === 'cn' ||
    originCountry.includes('KR') ||
    originCountry.includes('CN') ||
    originCountry.includes('TW') ||
    originCountry.includes('HK')
  ) {
    return true;
  }

  const genres = item.genres || [];
  const lowerGenres = genres.map((g) => g.toLowerCase());
  const titleLower = (item.title || '').toLowerCase();

  return (
    lowerGenres.some(
      (g) =>
        g.includes('kdrama') ||
        g.includes('k-drama') ||
        g.includes('cdrama') ||
        g.includes('c-drama') ||
        g.includes('korean') ||
        g.includes('chinese') ||
        g.includes('asian')
    ) ||
    titleLower.includes('kdrama') ||
    titleLower.includes('cdrama') ||
    titleLower.includes('queen of tears') ||
    titleLower.includes('dear x') ||
    titleLower.includes('our sticky love') ||
    (item.original_title ? /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/.test(item.original_title) : false)
  );
};

export const isPunjabiMedia = (item: MediaItem): boolean => {
  if (!item) return false;

  const origLang = (item.original_language || '').toLowerCase();
  if (origLang === 'pa' || origLang === 'pan') {
    return true;
  }

  const genres = item.genres || [];
  const lowerGenres = genres.map((g) => g.toLowerCase());
  const titleLower = (item.title || '').toLowerCase();
  const overviewLower = (item.overview || '').toLowerCase();

  return (
    lowerGenres.some((g) => g.includes('punjabi')) ||
    titleLower.includes('punjabi') ||
    overviewLower.includes('punjabi')
  );
};

export const isAnimeMedia = (item: MediaItem): boolean => {
  if (!item) return false;
  if (item.media_type === 'anime') return true;

  const origLang = (item.original_language || '').toLowerCase();
  const originCountry = item.origin_country || [];
  const genres = (item.genres || []).map((g) => g.toLowerCase());
  const titleLower = (item.title || '').toLowerCase();

  const isAnimation = genres.some((g) => g.includes('animation') || g.includes('anime'));
  const isJapanese = origLang === 'ja' || originCountry.includes('JP');

  return (
    (isAnimation && isJapanese) ||
    genres.includes('anime') ||
    titleLower.includes('daemons of the shadow realm') ||
    titleLower.includes('solo leveling') ||
    titleLower.includes('jujutsu kaisen') ||
    titleLower.includes('demon slayer') ||
    titleLower.includes('naruto') ||
    titleLower.includes('one piece') ||
    titleLower.includes('bleach') ||
    titleLower.includes('attack on titan')
  );
};

const SUB_FLAGS = 'sub=en&sub_lang=en&ds_lang=en&subtitles=1&cc_load_policy=1&auto_sub=1';

export const EMBED_SERVERS: EmbedServer[] = [
  {
    id: 'videasy',
    name: 'HD',
    badge: 'HD Server',
    getUrl: (type, id, season = 1, episode = 1) =>
      type === 'tv' || type === 'anime'
        ? `https://player.videasy.net/tv/${id}/${season}/${episode}?${SUB_FLAGS}`
        : `https://player.videasy.net/movie/${id}?${SUB_FLAGS}`,
  },
  {
    id: 'embedmaster',
    name: 'English',
    badge: 'English Server',
    getUrl: (type, id, season = 1, episode = 1) =>
      type === 'anime' || type === 'tv'
        ? `https://embedmaster.link/tv/${id}/${season}/${episode}?${SUB_FLAGS}`
        : `https://embedmaster.link/movie/${id}?${SUB_FLAGS}`,
  },
  {
    id: 'flmu',
    name: 'Indian',
    badge: 'Indian Server',
    getUrl: (type, id, season = 1, episode = 1) =>
      type === 'anime' || type === 'tv'
        ? `https://embed.filmu.in/tv/${id}/${season}/${episode}?${SUB_FLAGS}`
        : `https://embed.filmu.in/movie/${id}?${SUB_FLAGS}`,
  },
  {
    id: 'anime',
    name: 'Anime',
    badge: 'Anime Server (HD)',
    getUrl: (type, id, season = 1, episode = 1) =>
      type === 'movie'
        ? `https://player.videasy.net/movie/${id}?${SUB_FLAGS}`
        : `https://player.videasy.net/tv/${id}/${season}/${episode}?${SUB_FLAGS}`,
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
];

export const MOCK_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 550,
    title: 'Fight Club',
    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
    poster_path: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80',
    media_type: 'movie',
    release_date: '1999-10-15',
    vote_average: 8.4,
    genres: ['Drama', 'Action', 'Thriller'],
    duration: '2h 19m',
    quality: '4K Ultra HD',
  },
  {
    id: 27205,
    title: 'Inception',
    overview: 'Cobb, a skilled thief who steals corporate secrets through use of dream-sharing technology, is given the inverse task of planting an idea into the mind of a C.E.O.',
    poster_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80',
    media_type: 'movie',
    release_date: '2010-07-16',
    vote_average: 8.8,
    genres: ['Sci-Fi', 'Action', 'Adventure'],
    duration: '2h 28m',
    quality: '4K Ultra HD',
  },
  {
    id: 1399,
    title: 'Game of Thrones',
    overview: 'Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war.',
    poster_path: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=1600&auto=format&fit=crop&q=80',
    media_type: 'tv',
    first_air_date: '2011-04-17',
    vote_average: 8.4,
    genres: ['Action', 'Drama', 'Fantasy'],
    duration: '8 Seasons',
    quality: '1080p Full HD',
  },
  {
    id: 66732,
    title: 'Stranger Things',
    overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    poster_path: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
    media_type: 'tv',
    first_air_date: '2016-07-15',
    vote_average: 8.6,
    genres: ['Sci-Fi', 'Horror', 'Drama'],
    duration: '4 Seasons',
    quality: '4K HDR',
  },
  {
    id: 157336,
    title: 'Interstellar',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    poster_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&auto=format&fit=crop&q=80',
    media_type: 'movie',
    release_date: '2014-11-05',
    vote_average: 8.7,
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    duration: '2h 29m',
    quality: '4K Ultra HD',
  },
];

export const GENRE_PILLS = [
  'All',
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Drama',
  'Fantasy',
  'Horror',
  'Romance',
  'Sci-Fi',
  'Thriller',
];
