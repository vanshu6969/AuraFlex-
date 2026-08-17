import { YouTube } from 'youtube-sr';

const ANTI_CLIP_KEYWORDS = [
  '#shorts',
  'shorts',
  'promo',
  'teaser',
  'trailer',
  'review',
  'preview',
  'behind the scenes',
  'ost',
  'status',
  'clip',
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { title, season = '1', episode = '1', type = 'tv', language = '', skipVideoId = '', skipIds = '' } = req.query;

  if (!title) {
    return res.status(400).json({ success: false, error: 'Title parameter is required' });
  }

  // Parse skip IDs list (to bypass videos with embedding disabled - Error 150/101)
  const rawSkip = `${skipVideoId},${skipIds}`.split(',').map((s) => s.trim()).filter(Boolean);
  const skipSet = new Set(rawSkip);

  const cleanTitle = title.replace(/[-_]/g, ' ').trim();
  const epNum = parseInt(String(episode), 10) || 1;
  const epPadded = String(epNum).padStart(2, '0');
  const seasonNum = parseInt(String(season), 10) || 1;

  // Build Query Waterfall
  const queries = [];
  if (type === 'movie') {
    queries.push(`${cleanTitle} Full Movie`);
    queries.push(`${cleanTitle}`);
  } else {
    queries.push(`${cleanTitle} Episode ${epPadded}`);
    queries.push(`${cleanTitle} Ep ${epNum}`);
    queries.push(`${cleanTitle} Episode ${epNum}`);
    queries.push(`${cleanTitle} Season ${seasonNum} Episode ${epNum} Full Episode`);
    queries.push(`${cleanTitle} EP${epNum}`);
    queries.push(`${cleanTitle}`);
  }

  let minDuration = 600000; // 10 minutes default for TV / Desi / Asian Dramas
  if (type === 'movie') {
    minDuration = 2400000; // 40 minutes for Movies
  }

  let selectedVideo = null;
  let allCandidates = [];

  for (const q of queries) {
    const searchString = language ? `${q} ${language}` : q;
    try {
      let videos = [];
      const results = await YouTube.search(searchString, { limit: 12, type: 'video' });
      if (results && results.length > 0) {
        videos = results
          .map((v) => ({
            id: v.id || '',
            title: v.title || '',
            duration: v.duration || 0,
            channel: { name: v.channel?.name || 'YouTube' },
          }))
          .filter((v) => Boolean(v.id) && !skipSet.has(v.id));
      }

      if (videos.length === 0) continue;

      // 1. Anti-Clip Filter
      const filtered = videos.filter((v) => {
        const vTitle = v.title.toLowerCase();
        return !ANTI_CLIP_KEYWORDS.some((kw) => vTitle.includes(kw));
      });

      const candidates = filtered.length > 0 ? filtered : videos;
      allCandidates.push(...candidates);

      // 2. Duration Guard (> minDuration)
      const longForm = candidates.filter((v) => v.duration >= minDuration);

      if (longForm.length > 0) {
        selectedVideo = longForm[0];
        break;
      }
    } catch (err) {
      console.log(`YouTube search query "${searchString}" failed:`, err.message);
    }
  }

  // Fallback: HTML scraping if no candidate found via youtube-sr
  if (!selectedVideo && allCandidates.length === 0) {
    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${cleanTitle} Episode ${epPadded}`
      )}`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      const html = await response.text();
      const matches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
      const ids = [...new Set(matches.map((m) => m[1]))].filter((id) => !skipSet.has(id));

      if (ids.length > 0) {
        selectedVideo = {
          id: ids[0],
          title: `${cleanTitle} ${type === 'movie' ? 'Full Movie' : `Episode ${epPadded}`}`,
          duration: 900000,
          channel: { name: 'YouTube' },
        };
      }
    } catch (fallbackErr) {
      console.log('HTML fallback error:', fallbackErr.message);
    }
  }

  // Fallback: Pick the longest available candidate video excluding skipped IDs
  if (!selectedVideo && allCandidates.length > 0) {
    const sortedByDuration = [...allCandidates].sort(
      (a, b) => (b.duration || 0) - (a.duration || 0)
    );
    selectedVideo = sortedByDuration[0];
  }

  if (!selectedVideo) {
    return res
      .status(404)
      .json({ success: false, error: 'No video streams found excluding skipped IDs' });
  }

  return res.status(200).json({
    success: true,
    videoId: selectedVideo.id,
    title: selectedVideo.title,
    duration: selectedVideo.duration,
    channel: selectedVideo.channel?.name || 'YouTube',
  });
}
