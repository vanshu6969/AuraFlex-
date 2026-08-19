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
      const data = await res.json();
      return data?.data?.Media?.id || null;
    } catch {
      return null;
    }
  },

  async getCategoryItems(categoryKey: string, page: number = 1): Promise<MediaItem[]> {
    try {
      let url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&page=${page}`;

      switch (categoryKey.toLowerCase()) {
        case 'marvel':
          url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&with_companies=420&sort_by=popularity.desc&page=${page}`;
          break;
        case 'dc':
          url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&with_companies=9993|128064&sort_by=popularity.desc&page=${page}`;
          break;
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
      const defaultType = ['marvel', 'dc', 'punjabi', 'bollywood', 'action', 'horror'].includes(categoryKey) ? 'movie' : 'tv';
      const list = data.results.map((item: any) => this.formatMediaItem(item, defaultType));
      return deduplicateMediaList(list);
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
      const personUrl = `${TMDB_BASE_URL}/person/${personId}?api_key=${TMDB_API_KEY}&language=en-US`;
      const creditsUrl = `${TMDB_BASE_URL}/person/${personId}/combined_credits?api_key=${TMDB_API_KEY}&language=en-US`;

      const [personRes, creditsRes] = await Promise.all([fetch(personUrl), fetch(creditsUrl)]);
      const personData = personRes.ok ? await personRes.json() : {};
      const creditsData = creditsRes.ok ? await creditsRes.json() : {};

      const rawWorks = (creditsData.cast || [])
        .filter((w: any) => w.poster_path)
        .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 18);

      const works = rawWorks.map((w: any) => this.formatMediaItem(w, w.media_type || 'movie'));

      return {
        name: personData.name || 'Actor',
        biography: personData.biography || '',
        profile_path: personData.profile_path ? `${IMAGE_BASE_URL}/w300${personData.profile_path}` : null,
        works: deduplicateMediaList(works),
      };
    } catch {
      return { name: 'Actor', biography: '', profile_path: null, works: [] };
    }
  },
};






