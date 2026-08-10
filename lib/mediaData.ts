import { EmbedServer, MediaItem } from '../types/media';


export const EMBED_SERVERS: EmbedServer[] = [
  {
    id: 'videasy',
    name: 'HD',
    badge: 'HD Server',
    getUrl: (type, id, season = 1, episode = 1) =>
      type === 'anime'
        ? `https://player.videasy.net/anime/${id}/${episode}?sub=en`
        : type === 'tv'
        ? `https://player.videasy.net/tv/${id}/${season}/${episode}?sub=en`
        : `https://player.videasy.net/movie/${id}?sub=en`,
  },
  {
    id: 'embedmaster',
    name: 'English',
    badge: 'English Server',
    getUrl: (type, id, season = 1, episode = 1) =>
      type === 'anime'
        ? `https://embedmaster.link/anime/${id}/${episode}?ds_lang=en`
        : type === 'tv'
        ? `https://embedmaster.link/tv/${id}/${season}/${episode}?ds_lang=en`
        : `https://embedmaster.link/movie/${id}?ds_lang=en`,
  },
  {
    id: 'flmu',
    name: 'Indian',
    badge: 'Indian Server',
    getUrl: (type, id, season = 1, episode = 1) =>
      type === 'anime'
        ? `https://embed.filmu.in/anime/${id}/${episode}`
        : type === 'tv'
        ? `https://embed.filmu.in/tv/${id}/${season}/${episode}`
        : `https://embed.filmu.in/movie/${id}`,
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
    duration: '2h 49m',
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
