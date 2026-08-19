import { Linking } from 'react-native';

export interface ResolveYouTubeParams {
  title: string;
  season?: number;
  episode?: number;
  type?: 'movie' | 'tv' | 'anime';
  language?: string;
}

export interface ResolveYouTubeResult {
  videoId: string | null;
  title?: string;
  channel?: string;
  duration?: number;
  isOverride?: boolean;
}

export interface DirectProxyStreamResult {
  success: boolean;
  directStreamUrl?: string;
  mimeType?: string;
  subtitles?: { url: string; lang: string }[];
  title?: string;
  channel?: string;
  isHls?: boolean;
  fallbackToIframe?: boolean;
}


// Static lookup map for verified full episodes & global mirrors (Overrides)
export const YOUTUBE_PRE_MAPPED_IDS: Record<string, Record<string, string>> = {
  // Aik Mohabbat Aur (Multiverse Entertainment)
  'aik mohabbat aur': {
    's1e1': 'kS59P6g0Qqs',
    's1e2': 'tPj5vVNn_8I',
    's1e3': '5939vAdp9Wc',
    's1e19': 'EwJcYqFt2Gg',
    's1e20': 'SPgloOZNfOI',
  },
  // Kabhi Main Kabhi Tum (ARY Digital)
  'kabhi main kabhi tum': {
    's1e1': 'b_1-X55V_Yk',
    's1e2': 'H1YkP_42B4E',
  },
  // RadhaKrishn (Star Bharat)
  'radhakrishn': {
    's1e1': 'wR_J50N2xMs',
  },
  // Never-Ending Summer (MangoTV Official)
  'never ending summer': {
    's1e1': '6PZLiidLCUE',
    's1e2': 'toic9368QPs',
    's1e27': '3HBclu9BOvg',
    's1e28': '0KMxQq5JQ7U',
  },
  // Yaar Jigree Kasooti Degree (Official Troll Punjabi)
  'yaar jigree kasooti degree': {
    's1e1': 'k41ZQyIim6E',
    's1e2': '6XfBj3y5pz8',
    's1e3': '-dDxqWMuLBU',
    's1e4': 'RAwRcYP5gUc',
    's1e5': 'zSkkmxM1N3I',
    's1e6': 'FCXYYnr6ZZA',
    's1e7': 'AsDZOLB8PIg',
    's1e8': '6TIxMJ12ia4',
    's1e9': 'cX085GD9Xtg',
    's1e10': 'BtTrn5mIDJk',
    's1e11': 'B03tPXF_MJ0',
    's1e12': 'pTtGOUd16Zw',
    's1e13': 'hzq7xFq15Gs',
    's2e1': 'FxrW3dqbVl4',
    's2e2': 'ir2dEKIZ0O0',
    's2e3': 'UWfzKaUeKWE',
    's2e4': 'XqXdLVnpwJE',
    's2e5': 'h_BILKqBQFQ',
    's2e7': 'i8NCRtok_tM',
    's2e10': 'RiPfSfVcPSk',
    's2e12': 'wxVUEvwZacc',
    's2e13': 'M5BsZK02mZg',
  },
  // Doraemon Classic
  'doraemon': {
    's1e1': '31_O_W4U5q8',
  },
  // Shin-chan Classic
  'shin chan': {
    's1e1': 'lQ1n8J9vY9U',
  },
};

export const YOUTUBE_OVERRIDE_MAP = YOUTUBE_PRE_MAPPED_IDS;

export const sanitizeYouTubeInput = (input: string): string | null => {
  if (!input) return null;
  const trimmed = input.trim();
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) return match[1];
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  return null;
};

/**
 * Checks if a YouTube video is publicly available and viewable in India via oEmbed
 */
export const checkIndiaAvailability = async (videoId: string): Promise<boolean> => {
  if (!videoId) return false;
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(
      videoId
    )}&format=json`;
    const response = await fetch(oembedUrl, {
      headers: {
        'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
      },
    });
    return response.status === 200;
  } catch (err) {
    return true;
  }
};

/**
 * Resolves YouTube video ID from override map or backend scraper.
 */
export const resolveYouTubeVideo = async (
  params: ResolveYouTubeParams
): Promise<ResolveYouTubeResult> => {
  const { title, season = 1, episode = 1, type = 'tv', language = '' } = params;
  if (!title) return { videoId: null };

  const normalizedTitle = title.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Pre-Mapped Override Check
  for (const [key, map] of Object.entries(YOUTUBE_PRE_MAPPED_IDS)) {
    const normalizedKey = key.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
    if (normalizedTitle.includes(normalizedKey)) {
      const epKey = `s${season}e${episode}`;
      if (map[epKey]) {
        return {
          videoId: map[epKey],
          title: `${title} S${season} E${episode}`,
          isOverride: true,
        };
      }
    }
  }

  // 2. Dynamic Backend Scraper Trigger
  try {
    const queryParams = new URLSearchParams({
      title,
      season: season.toString(),
      episode: episode.toString(),
      type,
      ...(language ? { language } : {}),
    });

    const baseUrl =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'https://auraflexmovies.vercel.app'
        : '';

    const res = await fetch(`${baseUrl}/api/yt-stream?${queryParams.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.videoId) {
        return {
          videoId: data.videoId,
          title: data.title,
          channel: data.channel,
          duration: data.duration,
          isOverride: false,
        };
      }
    }
  } catch (err) {
    console.log('Error triggering /api/yt-stream:', err);
  }

  return { videoId: null };
};

/**
 * Resolves direct HLS / MP4 video stream URL via /api/yt-proxy-stream to bypass YouTube geo-restrictions.
 */
export const fetchDirectProxyStream = async (videoId: string): Promise<DirectProxyStreamResult> => {
  try {
    const baseUrl =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'https://auraflexmovies.vercel.app'
        : '';

    const res = await fetch(`${baseUrl}/api/yt-proxy-stream?videoId=${encodeURIComponent(videoId)}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.log('Direct proxy stream fetch error:', err);
  }

  return { success: false, fallbackToIframe: true };
};

export const openYouTubeSearch = (query: string) => {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  Linking.openURL(url).catch((err) => console.log('Could not open YouTube search:', err));
};

export const openYouTubeVideo = (videoId: string) => {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  Linking.openURL(url).catch((err) => console.log('Could not open YouTube video:', err));
};

export const openInvidiousProxy = (videoId: string) => {
  const url = `https://invidious.nerdvpn.de/watch?v=${videoId}`;
  Linking.openURL(url).catch((err) => console.log('Could not open Invidious proxy:', err));
};
