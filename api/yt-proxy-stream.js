import fetch from 'node-fetch';

const PIPED_INSTANCES = [
  'https://api.piped.privacydev.net',
  'https://pipedapi.kavin.rocks',
  'https://piped-api.garudalinux.org',
  'https://pipedapi.tokhmi.xyz',
];

const INVIDIOUS_INSTANCES = [
  'https://invidious.nerdvpn.de',
  'https://inv.tux.pizza',
  'https://invidious.flokinet.to',
  'https://invidious.privacydev.net',
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

  const { videoId } = req.query;

  if (!videoId || typeof videoId !== 'string') {
    return res.status(400).json({ success: false, error: 'videoId parameter is required' });
  }

  const cleanVideoId = videoId.trim();

  // 1. Try Piped API Instances for HLS / Direct Streams
  for (const instance of PIPED_INSTANCES) {
    try {
      const response = await fetch(`${instance}/streams/${cleanVideoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 4000,
      });

      if (response.ok) {
        const data = await response.json();

        const directStreamUrl =
          data.hls ||
          (data.videoStreams && data.videoStreams.length > 0
            ? data.videoStreams.find((s) => s.quality === '1080p' || s.quality === '720p')?.url ||
              data.videoStreams[0].url
            : null);

        if (directStreamUrl) {
          const mimeType = data.hls ? 'application/x-mpegURL' : 'video/mp4';
          const subtitles = (data.subtitles || []).map((sub) => ({
            url: sub.url,
            lang: sub.name || sub.code,
          }));

          return res.status(200).json({
            success: true,
            streamUrl: directStreamUrl,
            directStreamUrl,
            mimeType,
            subtitles,
            title: data.title || '',
            channel: data.uploader || '',
          });
        }
      }
    } catch (err) {
      console.log(`Piped instance ${instance} error:`, err.message);
    }
  }

  // 2. Try Invidious API Instances
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(`${instance}/api/v1/videos/${cleanVideoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 4000,
      });

      if (response.ok) {
        const data = await response.json();
        const hlsUrl = data.hlsUrl;
        const formatStreams = data.formatStreams || [];

        const directStreamUrl =
          hlsUrl ||
          (formatStreams.length > 0 ? formatStreams[formatStreams.length - 1].url : null);

        if (directStreamUrl) {
          const mimeType = hlsUrl ? 'application/x-mpegURL' : 'video/mp4';
          const subtitles = (data.captions || []).map((c) => ({
            url: `${instance}${c.url}`,
            lang: c.label || c.languageCode,
          }));

          return res.status(200).json({
            success: true,
            streamUrl: directStreamUrl,
            directStreamUrl,
            mimeType,
            subtitles,
            title: data.title || '',
            channel: data.author || '',
          });
        }
      }
    } catch (err) {
      console.log(`Invidious instance ${instance} error:`, err.message);
    }
  }

  return res.status(200).json({
    success: false,
    fallbackToIframe: true,
    error: 'Could not extract direct stream URL across public proxies',
  });
}
