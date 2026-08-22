import { MOCK_MEDIA_ITEMS } from '../lib/mediaData';
import { supabase } from '../lib/supabase';

export interface SitemapEntry {
  url: string;
  lastModified?: Date | string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export default async function sitemap(): Promise<SitemapEntry[]> {
  const baseUrl = 'https://auraflexmovies.vercel.app';
  const lastModified = new Date();

  // 1. Core static application routes
  const staticRoutes: SitemapEntry[] = [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/series`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...['marvel', 'dc', 'anime', 'kdrama', 'cdrama', 'punjabi', 'bollywood', 'hollywood-series', 'indian-series', 'action', 'comedy', 'horror'].map((cat) => ({
      url: `${baseUrl}/explore/${cat}`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    })),
    {
      url: `${baseUrl}/watchlist`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/history`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  // 2. Dynamic stream override routes from Supabase
  let overrideRoutes: SitemapEntry[] = [];
  try {
    const { data: overrides } = await supabase.from('stream_overrides').select('media_id, media_type, updated_at');
    if (overrides && Array.isArray(overrides)) {
      overrideRoutes = overrides.map((item) => ({
        url: `${baseUrl}/watch/${item.media_type || 'movie'}/${item.media_id}`,
        lastModified: item.updated_at ? new Date(item.updated_at) : lastModified,
        changeFrequency: 'daily',
        priority: 0.9,
      }));
    }
  } catch (e) {}

  // 3. Featured media items & TMDB catalog
  const mediaRoutes: SitemapEntry[] = MOCK_MEDIA_ITEMS.map((item) => ({
    url: `${baseUrl}/watch/${item.media_type || 'movie'}/${item.id}`,
    lastModified,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // Combine and deduplicate routes by URL
  const allRoutes = [...staticRoutes, ...overrideRoutes, ...mediaRoutes];
  const uniqueMap = new Map<string, SitemapEntry>();
  for (const route of allRoutes) {
    if (!uniqueMap.has(route.url)) {
      uniqueMap.set(route.url, route);
    }
  }

  return Array.from(uniqueMap.values());
}
