import fetch from 'node-fetch';

// Global In-Memory Cache for resolved StreamTape direct URLs (valid for 3.5 hours)
const urlCache = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,HEAD');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Range'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, file, download } = req.query;
  let fileId = file;
  if (!fileId && url) {
    const match = String(url).match(/(?:\/e\/|\/v\/|file=)([a-zA-Z0-9_-]+)/);
    if (match) {
      fileId = match[1];
    } else {
      fileId = String(url).trim();
    }
  }

  if (!fileId) {
    return res.status(400).json({ success: false, error: 'url or file parameter is required' });
  }

  const login =
    process.env.STREAMTAPE_API_LOGIN ||
    process.env.NEXT_PUBLIC_STREAMTAPE_API_LOGIN ||
    '3d3c20e1f2980d24f437';
  const key =
    process.env.STREAMTAPE_API_KEY ||
    process.env.NEXT_PUBLIC_STREAMTAPE_API_KEY ||
    'xeqQKo1OJBFk2OQ';

  try {
    let cached = urlCache.get(fileId);
    let videoUrl = cached?.videoUrl;
    let name = cached?.name;
    let size = cached?.size;

    // Check if cache entry is missing or expired (older than 3.5 hours)
    if (!cached || Date.now() > cached.expiresAt) {
      // 1. Generate download ticket from StreamTape API
      const ticketRes = await fetch(
        `https://api.streamtape.com/file/dlticket?file=${encodeURIComponent(fileId)}&login=${encodeURIComponent(login)}&key=${encodeURIComponent(key)}`
      );
      const ticketData = await ticketRes.json();

      if (ticketData.status !== 200 || !ticketData.result?.ticket) {
        return res.status(200).json({
          success: false,
          error: ticketData.msg || 'Failed to generate download ticket from StreamTape',
        });
      }

      const ticket = ticketData.result.ticket;
      const waitTimeMs = Math.min(((ticketData.result.wait_time || 5) + 0.2) * 1000, 6000);

      // 2. Wait for StreamTape ticket timer
      await new Promise((resolve) => setTimeout(resolve, waitTimeMs));

      // 3. Resolve direct mp4 video URL
      const dlRes = await fetch(
        `https://api.streamtape.com/file/dl?file=${encodeURIComponent(fileId)}&ticket=${encodeURIComponent(ticket)}&login=${encodeURIComponent(login)}&key=${encodeURIComponent(key)}`
      );
      const dlData = await dlRes.json();

      if (dlData.status !== 200 || !dlData.result?.url) {
        return res.status(200).json({
          success: false,
          error: dlData.msg || 'Failed to retrieve direct stream URL from StreamTape',
        });
      }

      videoUrl = dlData.result.url;
      name = dlData.result.name;
      size = dlData.result.size;

      // Save to cache (valid for 3.5 hours)
      urlCache.set(fileId, {
        videoUrl,
        name,
        size,
        expiresAt: Date.now() + 3.5 * 3600 * 1000,
      });
    }

    // If json mode is requested, return metadata immediately
    if (req.query.json === '1') {
      return res.status(200).json({
        success: true,
        fileId,
        streamUrl: videoUrl,
        name,
        size,
      });
    }

    // 4. Proxy the MP4 video binary with Range header forwarding
    const rangeHeader = req.headers['range'];
    const proxyHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    if (rangeHeader) {
      proxyHeaders['Range'] = rangeHeader;
    }

    const streamResponse = await fetch(videoUrl, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: proxyHeaders,
    });

    res.status(streamResponse.status);

    const contentType = streamResponse.headers.get('content-type') || 'video/mp4';
    const contentLength = streamResponse.headers.get('content-length');
    const contentRange = streamResponse.headers.get('content-range');
    const acceptRanges = streamResponse.headers.get('accept-ranges') || 'bytes';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', acceptRanges);
    res.setHeader('Cache-Control', 'public, max-age=14400');

    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);

    if (download === '1') {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(name || 'video.mp4')}"`
      );
    } else {
      res.setHeader('Content-Disposition', 'inline');
    }

    if (req.method === 'HEAD') {
      return res.end();
    }

    // Pipe stream binary back to client
    streamResponse.body.pipe(res);
  } catch (err) {
    console.error('StreamTape Proxy Error:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal server error proxying StreamTape',
      });
    }
  }
}
