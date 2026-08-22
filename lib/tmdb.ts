import { MediaItem } from '../types/media';
import { supabase } from './supabase';
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

const deduplicateMediaList = (items: MediaItem[]): MediaItem[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item || item.id === undefined || item.id === null) return false;
    const key = `${item.media_type || 'movie'}_${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const MCU_TIMELINE_ORDER: Record<string, number> = {
  'captain america: the first avenger': 1,
  'captain marvel': 2,
  'iron man': 3,
  'iron man 2': 4,
  'the incredible hulk': 5,
  'thor': 6,
  'the avengers': 7,
  "marvel's the avengers": 7,
  'iron man 3': 8,
  'thor: the dark world': 9,
  'captain america: the winter soldier': 10,
  'guardians of the galaxy': 11,
  'guardians of the galaxy vol. 2': 12,
  'avengers: age of ultron': 13,
  'ant-man': 14,
  'captain america: civil war': 15,
  'black widow': 16,
  'black panther': 17,
  'spider-man: homecoming': 18,
  'doctor strange': 19,
  'thor: ragnarok': 20,
  'ant-man and the wasp': 21,
  'avengers: infinity war': 22,
  'avengers: endgame': 23,
  'loki': 24,
  'what if...?': 25,
  'wandavision': 26,
  'the falcon and the winter soldier': 27,
  'spider-man: far from home': 28,
  'shang-chi and the legend of the ten rings': 29,
  'eternals': 30,
  'spider-man: no way home': 31,
  'doctor strange in the multiverse of madness': 32,
  'hawkeye': 33,
  'moon knight': 34,
  'ms. marvel': 35,
  'thor: love and thunder': 36,
  'i am groot': 37,
  'she-hulk: attorney at law': 38,
  'werewolf by night': 39,
  'black panther: wakanda forever': 40,
  'the guardians of the galaxy holiday special': 41,
  'ant-man and the wasp: quantumania': 42,
  'guardians of the galaxy vol. 3': 43,
  'secret invasion': 44,
  'the marvels': 45,
  'echo': 46,
  'deadpool & wolverine': 47,
  'agatha all along': 48,
};

const DC_TIMELINE_ORDER: Record<string, number> = {
  'wonder woman': 1,
  'wonder woman 1984': 2,
  'man of steel': 3,
  'batman v superman: dawn of justice': 4,
  'suicide squad': 5,
  'justice league': 6,
  "zack snyder's justice league": 6,
  'aquaman': 7,
  'shazam!': 8,
  'birds of prey': 9,
  'the suicide squad': 10,
  'peacemaker': 11,
  'black adam': 12,
  'shazam! fury of the gods': 13,
  'the flash': 14,
  'blue beetle': 15,
  'aquaman and the lost kingdom': 16,
  'batman begins': 17,
  'the dark knight': 18,
  'the dark knight rises': 19,
  'the batman': 20,
  'the penguin': 21,
  'joker': 22,
  'joker: folie à deux': 23,
  'superman': 24,
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
      origin_country: raw.origin_country || (raw.origin_country_code ? [raw.origin_country_code] : []),
      original_language: raw.original_language,
    };
  },

  async getTrending(): Promise<MediaItem[]> {
    try {
      const res = await fetch(`${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}&language=en-US`);
      if (!res.ok) throw new Error('Trending fetch error');
      const data = await res.json();
      const list = data.results.map((item: any) => this.formatMediaItem(item));
      return deduplicateMediaList(list);
    } catch {
      return deduplicateMediaList(MOCK_MEDIA_ITEMS);
    }
  },

  async getPopularMovies(): Promise<MediaItem[]> {
    try {
      const res = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
      if (!res.ok) throw new Error('Popular movies fetch error');
      const data = await res.json();
      const list = data.results.map((item: any) => this.formatMediaItem(item, 'movie'));
      return deduplicateMediaList(list);
    } catch {
      return deduplicateMediaList(MOCK_MEDIA_ITEMS.filter((item) => item.media_type === 'movie'));
    }
  },


  isDailyTVSerial(item: any): boolean {
    if (!item) return false;
    const genre_ids: number[] = item.genre_ids || item.genres?.map((g: any) => g.id) || [];
    // 10766 = Soap, 10764 = Reality, 10767 = Talk
    if (genre_ids.includes(10766) || genre_ids.includes(10764) || genre_ids.includes(10767)) {
      return true;
    }
    const titleLower = (item.title || item.name || '').toLowerCase();
    const BLACKLIST = [
      'mahadev', 'pandya', 'anupama', 'kumkum', 'kundali', 'rishta', 'taarak',
      'saath nibhaana', 'bhabhi', 'savdhaan', 'crime patrol', 'naagin', 'ye hai mohabbatein',
      'ishqbaaz', 'diya aur baati', 'balika vadhu', 'sasural', 'kasautii', 'pavitra rishta',
      'uttaran', 'ghum hai', 'imlie', 'yeh rishta', 'parineetii', 'udaariyaan',
      'bhagya lakshmi', 'radhakrishn', 'vighnaharta', 'shrimad', 'cid', 'c.i.d.', 'bigg boss',
      'khatron ke khiladi', 'kaun banega', 'happu', 'kapil sharma', 'bhabiji',
      'choti sarrdaarni', 'molkki', 'meet', 'teriyaan', 'bade achhe', 'patiala babes',
      'sasural simar', 'kahaani ghar', 'kyunki saas', 'pyaar kii ye', 'sab tv', 'star plus',
      'aladdin', 'kaala teeka', 'bahu begum', 'charmsukh', 'palang tod', 'safed sagar',
      'ullu', 'kooku', 'rabbit', 'primeplay', 'altbalaji', 'gandi baat', 'mastram',
      ' teri meri', 'doriyaann', 'faltu', 'dua', 'titlie'
    ];
    return BLACKLIST.some((kw) => titleLower.includes(kw));
  },

  async getTopTVShows(): Promise<MediaItem[]> {
    try {
      const res = await fetch(`${TMDB_BASE_URL}/tv/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
      if (!res.ok) throw new Error('Top TV shows fetch error');
      const data = await res.json();
      const filtered = data.results.filter((item: any) => !this.isDailyTVSerial(item));
      const list = filtered.map((item: any) => this.formatMediaItem(item, 'tv'));
      return deduplicateMediaList(list);
    } catch {
      return deduplicateMediaList(MOCK_MEDIA_ITEMS.filter((item) => item.media_type === 'tv'));
    }
  },

  async getAllSeries(maxPages: number = 5): Promise<MediaItem[]> {
    try {
      const pagePromises = Array.from({ length: maxPages }, (_, i) => i + 1).map((page) =>
        fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`).then((r) =>
          r.ok ? r.json() : { results: [] }
        )
      );

      const pageResults = await Promise.all(pagePromises);
      const allItems: any[] = [];
      const seenIds = new Set<number>();

      for (const resData of pageResults) {
        if (resData.results && Array.isArray(resData.results)) {
          for (const item of resData.results) {
            if (!seenIds.has(item.id) && !this.isDailyTVSerial(item)) {
              seenIds.add(item.id);
              allItems.push(item);
            }
          }
        }
      }

      // Sort from NEWEST to OLDEST (by first_air_date descending)
      allItems.sort((a, b) => {
        const dateA = new Date(a.first_air_date || 0).getTime();
        const dateB = new Date(b.first_air_date || 0).getTime();
        return dateB - dateA;
      });

      const list = allItems.map((item) => this.formatMediaItem(item, 'tv'));
      return deduplicateMediaList(list);
    } catch {
      return deduplicateMediaList(MOCK_MEDIA_ITEMS.filter((item) => item.media_type === 'tv'));
    }
  },

  async getAsianDramas(): Promise<MediaItem[]> {
    try {
      const res = await fetch(
        `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&with_original_language=ko|zh|ja&sort_by=popularity.desc&page=1`
      );
      if (!res.ok) throw new Error('Asian dramas fetch error');
      const data = await res.json();
      const filtered = data.results.filter((item: any) => !this.isDailyTVSerial(item));
      const list = filtered.map((item: any) => this.formatMediaItem(item, 'tv'));
      return deduplicateMediaList(list);
    } catch {
      return deduplicateMediaList(MOCK_MEDIA_ITEMS.filter((item) => item.media_type === 'tv'));
    }
  },


  async getPunjabiAndWebSeries(): Promise<MediaItem[]> {
    try {
      const res = await fetch(
        `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&with_original_language=hi|pa&sort_by=vote_count.desc&page=1`
      );
      if (!res.ok) throw new Error('Web series fetch error');
      const data = await res.json();
      const filtered = data.results.filter((item: any) => !this.isDailyTVSerial(item));
      const fetched = filtered.map((item: any) => this.formatMediaItem(item, 'tv'));
      const mockItems = MOCK_MEDIA_ITEMS.filter(
        (m) => m.id === 232301 || m.title.toLowerCase().includes('jigree') || m.title.toLowerCase().includes('outlaw')
      );
      return [...mockItems, ...fetched.filter((f: any) => String(f.id) !== '232301')];
    } catch {
      return MOCK_MEDIA_ITEMS;
    }
  },

  async getRecentlyAdded(page: number = 1): Promise<MediaItem[]> {
    try {
      let supabaseItems: MediaItem[] = [];

      // 1. Fetch recently updated stream overrides from Supabase (paginated range)
      try {
        const fromIndex = (page - 1) * 15;
        const toIndex = page * 15 - 1;
        const { data: overrides } = await supabase
          .from('stream_overrides')
          .select('*')
          .order('updated_at', { ascending: false })
          .range(fromIndex, toIndex);

        if (overrides && overrides.length > 0) {
          for (const item of overrides) {
            const tmdbId = item.tmdb_id;
            const mediaType: 'movie' | 'tv' | 'anime' = item.media_type === 'tv' ? 'tv' : item.media_type === 'anime' ? 'anime' : 'movie';

            // Detail fetch from TMDB if tmdbId is numeric
            if (tmdbId && /^\d+$/.test(tmdbId)) {
              try {
                const res = await fetch(`${TMDB_BASE_URL}/${mediaType === 'anime' ? 'tv' : mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`);
                if (res.ok) {
                  const raw = await res.json();
                  const formatted = this.formatMediaItem(raw, mediaType);
                  if (item.season && item.episode) {
                    formatted.season = parseInt(String(item.season), 10);
                    formatted.episode = parseInt(String(item.episode), 10);
                  }
                  supabaseItems.push(formatted);
                  continue;
                }
              } catch {}
            }

            // Fallback for custom stream overrides without TMDB details
            supabaseItems.push({
              id: item.tmdb_id,
              title: item.title || 'Recently Added Release',
              overview: 'Stream and download recently updated release on AuraFlex Movies.',
              poster_path: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
              backdrop_path: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80',
              media_type: mediaType,
              vote_average: 8.5,
              genres: ['Action', 'Drama'],
              quality: '1080p Full HD',
              season: item.season ? parseInt(String(item.season), 10) : undefined,
              episode: item.episode ? parseInt(String(item.episode), 10) : undefined,
              updated_at: item.updated_at,
            });
          }
        }
      } catch (e) {
        console.warn('[getRecentlyAdded] Supabase query notice:', e);
      }

      // 2. Fetch recent TV episode releases from TMDB (page parameter)
      let tvEpisodeItems: MediaItem[] = [];
      try {
        const tvRes = await fetch(`${TMDB_BASE_URL}/tv/on_the_air?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`);
        if (tvRes.ok) {
          const tvData = await tvRes.json();
          tvEpisodeItems = (tvData.results || []).map((raw: any) => {
            const formatted = this.formatMediaItem(raw, 'tv');
            formatted.season = raw.last_episode_to_air?.season_number || 1;
            formatted.episode = raw.last_episode_to_air?.episode_number || 1;
            if (raw.last_episode_to_air?.still_path) {
              formatted.still_path = `${IMAGE_BASE_URL}/w500${raw.last_episode_to_air.still_path}`;
            }
            return formatted;
          });
        }
      } catch (e) {}

      // 3. Fetch recent movie releases from TMDB (page parameter)
      let movieItems: MediaItem[] = [];
      try {
        const movieRes = await fetch(`${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`);
        if (movieRes.ok) {
          const movieData = await movieRes.json();
          movieItems = (movieData.results || []).map((raw: any) => this.formatMediaItem(raw, 'movie'));
        }
      } catch (e) {}

      // Interleave/combine all feeds into a single unified list
      const combined = [...supabaseItems, ...tvEpisodeItems, ...movieItems];
      const deduplicated = deduplicateMediaList(combined);

      return deduplicated.length > 0 ? deduplicated : [...MOCK_MEDIA_ITEMS].reverse();
    } catch {
      return [...MOCK_MEDIA_ITEMS].reverse();
    }
  },

  async getMediaDetails(id: string | number, type: string = 'movie'): Promise<MediaItem | null> {
    const primaryType: 'movie' | 'tv' = type === 'tv' ? 'tv' : 'movie';
    const secondaryType: 'movie' | 'tv' = primaryType === 'movie' ? 'tv' : 'movie';

    try {
      const res = await fetch(`${TMDB_BASE_URL}/${primaryType}/${id}?api_key=${TMDB_API_KEY}&language=en-US`);
      if (res.ok) {
        const data = await res.json();
        return this.formatMediaItem(data, primaryType);
      }
    } catch {}

    try {
      const altRes = await fetch(`${TMDB_BASE_URL}/${secondaryType}/${id}?api_key=${TMDB_API_KEY}&language=en-US`);
      if (altRes.ok) {
        const altData = await altRes.json();
        return this.formatMediaItem(altData, secondaryType);
      }
    } catch {}

    const fallback = MOCK_MEDIA_ITEMS.find((m) => String(m.id) === String(id));
    return fallback || null;
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

  async getAniListId(title: string): Promise<number | null> {
    try {
      const query = `
        query ($search: String) {
          Media (search: $search, type: ANIME) {
            id
          }
        }
      `;
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { search: title },
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.data?.Media?.id || null;
    } catch {
      return null;
    }
  },
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

    const yearStr = (raw.release_date || raw.first_air_date || '').substring(0, 4);

    return {
      id: raw.id,
      title,
      overview: raw.overview || 'Stream high quality movies & shows on AuraFlex Movies.',
      poster_path,
      backdrop_path,
      media_type: media_type as 'movie' | 'tv' | 'anime',
      vote_average: raw.vote_average ? parseFloat(raw.vote_average.toFixed(1)) : 8.5,
      year: yearStr ? parseInt(yearStr, 10) : undefined,
      genres: genres.length > 0 ? genres : ['Action', 'Drama'],
      quality: '1080p Full HD',
    };
  },

  async getCategoryItems(
    categoryKey: string,
    page: number = 1,
    sortBy: string = 'popularity'
  ): Promise<MediaItem[]> {
    try {
      let rawList: any[] = [];
      const catLower = categoryKey.toLowerCase();

      if (catLower === 'marvel') {
        const [moviesRes, tvRes] = await Promise.all([
          fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&with_companies=420|7505|38679|19551&sort_by=popularity.desc&page=${page}`),
          fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&with_companies=420|7505|38679|19551&sort_by=popularity.desc&page=${page}`),
        ]);
        const moviesData = moviesRes.ok ? await moviesRes.json() : { results: [] };
        const tvData = tvRes.ok ? await tvRes.json() : { results: [] };

        const movies = (moviesData.results || []).map((i: any) => this.formatMediaItem(i, 'movie'));
        const shows = (tvData.results || []).map((i: any) => this.formatMediaItem(i, 'tv'));
        rawList = [...movies, ...shows];
      } else if (catLower === 'dc') {
        const [moviesRes, tvRes] = await Promise.all([
          fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&with_companies=9993|128064|429&sort_by=popularity.desc&page=${page}`),
          fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&with_companies=9993|128064|429&sort_by=popularity.desc&page=${page}`),
        ]);
        const moviesData = moviesRes.ok ? await moviesRes.json() : { results: [] };
        const tvData = tvRes.ok ? await tvRes.json() : { results: [] };

        const movies = (moviesData.results || []).map((i: any) => this.formatMediaItem(i, 'movie'));
        const shows = (tvData.results || []).map((i: any) => this.formatMediaItem(i, 'tv'));
        rawList = [...movies, ...shows];
      } else {
        let url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&page=${page}`;

        switch (catLower) {
          case 'anime':
            url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${page}`;
            break;
          case 'kdrama':
            url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&with_original_language=ko&with_genres=18&sort_by=popularity.desc&page=${page}`;
            break;
          case 'cdrama':
            url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&with_original_language=zh&with_genres=18&sort_by=popularity.desc&page=${page}`;
            break;
          case 'punjabi':
            url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&with_original_language=pa&sort_by=popularity.desc&page=${page}`;
            break;
          case 'bollywood':
            url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&with_original_language=hi&sort_by=popularity.desc&page=${page}`;
            break;
          case 'hollywood-series':
            url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&with_original_language=en&without_genres=16&sort_by=popularity.desc&page=${page}`;
            break;
          case 'indian-series':
            url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&with_original_language=hi|pa|ta|te&sort_by=popularity.desc&page=${page}`;
            break;
          case 'action':
            url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&with_genres=28,12&sort_by=popularity.desc&page=${page}`;
            break;
          case 'comedy':
            url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&with_genres=35&sort_by=popularity.desc&page=${page}`;
            break;
          case 'horror':
            url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&with_genres=27&sort_by=popularity.desc&page=${page}`;
            break;
          default:
            url = `${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error('Category fetch error');
        const data = await res.json();
        const defaultType = ['punjabi', 'bollywood', 'action', 'horror'].includes(catLower) ? 'movie' : 'tv';
        rawList = data.results.map((item: any) => this.formatMediaItem(item, defaultType));
      }

      let items = deduplicateMediaList(rawList);

      // Perform custom sorting
      if (sortBy === 'release_asc') {
        items.sort((a, b) => (a.year || 9999) - (b.year || 9999));
      } else if (sortBy === 'release_desc') {
        items.sort((a, b) => (b.year || 0) - (a.year || 0));
      } else if (sortBy === 'watch_order') {
        const orderMap = catLower === 'marvel' ? MCU_TIMELINE_ORDER : DC_TIMELINE_ORDER;
        items.sort((a, b) => {
          const titleA = (a.title || '').toLowerCase();
          const titleB = (b.title || '').toLowerCase();
          const orderA = orderMap[titleA] || 999;
          const orderB = orderMap[titleB] || 999;

          if (orderA !== orderB) return orderA - orderB;
          return (a.year || 9999) - (b.year || 9999);
        });
      }

      return items;
    } catch {
      return MOCK_MEDIA_ITEMS;
    }
  },

  async getAnimeCollection(): Promise<MediaItem[]> {
    return this.getCategoryItems('anime', 1);
  },

  async getKdramaCollection(): Promise<MediaItem[]> {
    return this.getCategoryItems('kdrama', 1);
  },

  async getPunjabiBollywoodCollection(): Promise<MediaItem[]> {
    return this.getCategoryItems('punjabi', 1);
  },

  async getMarvelDCCollection(): Promise<MediaItem[]> {
    return this.getCategoryItems('marvel', 1);
  },

  async getComedyCollection(): Promise<MediaItem[]> {
    return this.getCategoryItems('comedy', 1);
  },

  async getActionAdventureCollection(): Promise<MediaItem[]> {
    return this.getCategoryItems('action', 1);
  },

  async getCredits(
    mediaId: string | number,
    mediaType: string = 'movie'
  ): Promise<Array<{ id: number; name: string; character: string; profile_path: string | null }>> {
    try {
      const type = mediaType === 'tv' || mediaType === 'anime' ? 'tv' : 'movie';
      const url = `${TMDB_BASE_URL}/${type}/${mediaId}/credits?api_key=${TMDB_API_KEY}&language=en-US`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.cast || []).slice(0, 18).map((person: any) => ({
        id: person.id,
        name: person.name,
        character: person.character || 'Actor',
        profile_path: person.profile_path ? `${IMAGE_BASE_URL}/w185${person.profile_path}` : null,
      }));
    } catch {
      return [];
    }
  },

  async getPersonCredits(
    personId: number
  ): Promise<{ name: string; biography: string; profile_path: string | null; works: MediaItem[] }> {
    try {
      const url = `${TMDB_BASE_URL}/person/${personId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=combined_credits`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch person credits');
      const data = await res.json();

      const name = data.name || 'Actor';
      const biography = data.biography || '';
      const profile_path = data.profile_path ? `${IMAGE_BASE_URL}/w300${data.profile_path}` : null;

      const rawCast = data.combined_credits?.cast || [];
      const rawCrew = data.combined_credits?.crew || [];
      const combined = [...rawCast, ...rawCrew];

      // Extract all combined entries, deduplicate by ID, and sort descending by popularity
      const formattedWorks = combined
        .filter((item: any) => item && (item.title || item.name))
        .map((item: any) => this.formatMediaItem(item, item.media_type || 'movie'))
        .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));

      const works = deduplicateMediaList(formattedWorks);

      return {
        name,
        biography,
        profile_path,
        works,
      };
    } catch {
      return { name: 'Actor', biography: '', profile_path: null, works: [] };
    }
  },
};






