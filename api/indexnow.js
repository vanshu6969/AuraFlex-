import fetch from 'node-fetch';

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

  const indexNowKey =
    process.env.INDEXNOW_KEY ||
    process.env.NEXT_PUBLIC_INDEXNOW_KEY ||
    'Ranjit@29';

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.EXPO_PUBLIC_SITE_URL ||
    'https://auraflexmovies.vercel.app';

  let host = 'auraflexmovies.vercel.app';
  try {
    const parsed = new URL(siteUrl);
    host = parsed.hostname;
  } catch (e) {}

  if (req.method === 'GET') {
    // Return key location verification info or plaintext key
    if (req.query.key === '1') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(indexNowKey);
    }
    return res.status(200).json({
      success: true,
      host,
      key: indexNowKey,
      keyLocation: `${siteUrl}/${indexNowKey}.txt`,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { tmdbId, type = 'movie', url, urls } = body;

    let urlList = [];

    if (Array.isArray(urls) && urls.length > 0) {
      urlList = urls.map((u) => (u.startsWith('http') ? u : `${siteUrl}${u.startsWith('/') ? '' : '/'}${u}`));
    } else if (url) {
      urlList = [url.startsWith('http') ? url : `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}`];
    } else if (tmdbId) {
      urlList = [`${siteUrl}/watch/${type}/${tmdbId}`];
    } else {
      urlList = [`${siteUrl}/`, `${siteUrl}/series`, `${siteUrl}/explore`];
    }

    const payload = {
      host: host,
      key: indexNowKey,
      keyLocation: `${siteUrl}/${indexNowKey}.txt`,
      urlList: urlList,
    };

    // Submit payload to IndexNow API (Bing / Yandex / Seznam)
    const indexNowRes = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const isSuccess = indexNowRes.status === 200 || indexNowRes.status === 202;

    return res.status(200).json({
      success: isSuccess,
      status: indexNowRes.status,
      host,
      keyLocation: payload.keyLocation,
      submittedUrls: urlList,
    });
  } catch (err) {
    console.error('IndexNow Submission Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to submit IndexNow request',
    });
  }
}
