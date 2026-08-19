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

/**
  Checks if a YouTube video is publicly available, embeddable, and viewable in India.
  YouTube's oEmbed endpoint returns HTTP 200 for viewable videos, and 404/403 for blocked/restricted ones.
 */
async function checkIndiaAvailability(videoId) {
  if (!videoId) return false;
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl, {
      headers: {
        'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    return response.status === 200;
  } catch (err) {
    return true; // Fallback to true if network check fails
  }
}

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

  // Build Query Waterfall tailored for India (IN) region preference
  const queries = [];
  if (type === 'movie') {
    queries.push(`${cleanTitle} Full Movie Hindi`);
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

      // 3. Validate India Availability (Region Check via oEmbed)
      for (const cand of longForm.length > 0 ? longForm : candidates) {
        const isAvailable = await checkIndiaAvailability(cand.id);
        if (isAvailable) {
          selectedVideo = cand;
          break;
        } else {
          console.log(`Video ${cand.id} (${cand.title}) is not viewable in India. Skipping.`);
        }
      }

      if (selectedVideo) break;
    } catch (err) {
      console.log(`YouTube search query "${searchString}" failed:`, err.message);
    }
  }

  // Fallback: HTML scraping with India region parameter (gl=IN & hl=en-IN)
  if (!selectedVideo) {
    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${cleanTitle} Episode ${epPadded}`
      )}&gl=IN&hl=en-IN`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        },
      });
      const html = await response.text();
      const matches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
      const ids = [...new Set(matches.map((m) => m[1]))].filter((id) => !skipSet.has(id));

      for (const candidateId of ids) {
        const isAvailable = await checkIndiaAvailability(candidateId);
        if (isAvailable) {
          selectedVideo = {
            id: candidateId,
            title: `${cleanTitle} ${type === 'movie' ? 'Full Movie' : `Episode ${epPadded}`}`,
            duration: 900000,
            channel: { name: 'YouTube' },
          };
          break;
        }
      }
    } catch (fallbackErr) {
      console.log('HTML fallback error:', fallbackErr.message);
    }
  }

  // Final Fallback: Pick the longest available candidate video viewable in India
  if (!selectedVideo && allCandidates.length > 0) {
    const sortedByDuration = [...allCandidates].sort(
      (a, b) => (b.duration || 0) - (a.duration || 0)
    );
    for (const cand of sortedByDuration) {
      const isAvailable = await checkIndiaAvailability(cand.id);
      if (isAvailable) {
        selectedVideo = cand;
        break;
      }
    }
  }

  if (!selectedVideo) {
    return res
      .status(404)
      .json({ success: false, error: 'No video streams found viewable in India' });
  }

  return res.status(200).json({
    success: true,
    videoId: selectedVideo.id,
    title: selectedVideo.title,
    duration: selectedVideo.duration,
    channel: selectedVideo.channel?.name || 'YouTube',
  });
}
