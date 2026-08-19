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

  const { file, url } = req.query;

  let fileId = file;
  if (!fileId && url) {
    const match = String(url).match(/(?:\/e\/|\/v\/|file=)([a-zA-Z0-9_-]+)/);
    if (match) {
      fileId = match[1];
    }
  }

  if (!fileId) {
    return res.status(400).json({ success: false, error: 'File ID or StreamTape URL parameter is required' });
  }

  const login = process.env.STREAMTAPE_API_LOGIN || process.env.NEXT_PUBLIC_STREAMTAPE_API_LOGIN || '3d3c20e1f2980d24f437';
  const key = process.env.STREAMTAPE_API_KEY || process.env.NEXT_PUBLIC_STREAMTAPE_API_KEY || 'xeqQKo1OJBFk2OQ';

  try {
    // 1. Get download ticket from StreamTape API
    const ticketUrl = `https://api.streamtape.com/file/dlticket?file=${encodeURIComponent(fileId)}&login=${encodeURIComponent(login)}&key=${encodeURIComponent(key)}`;
    const ticketRes = await fetch(ticketUrl);
    const ticketData = await ticketRes.json();

    if (ticketData.status !== 200 || !ticketData.result?.ticket) {
      return res.status(400).json({
        success: false,
        error: ticketData.msg || 'Failed to generate download ticket from StreamTape',
      });
    }

    const ticket = ticketData.result.ticket;
    const waitTimeMs = ((ticketData.result.wait_time || 5) + 0.5) * 1000;

    // 2. Wait for StreamTape ticket timer
    await new Promise((resolve) => setTimeout(resolve, waitTimeMs));

    // 3. Resolve direct mp4 download stream URL
    const dlUrl = `https://api.streamtape.com/file/dl?file=${encodeURIComponent(fileId)}&ticket=${encodeURIComponent(ticket)}&login=${encodeURIComponent(login)}&key=${encodeURIComponent(key)}`;
    const dlRes = await fetch(dlUrl);
    const dlData = await dlRes.json();

    if (dlData.status !== 200 || !dlData.result?.url) {
      return res.status(400).json({
        success: false,
        error: dlData.msg || 'Failed to retrieve direct video stream from StreamTape',
      });
    }

    return res.status(200).json({
      success: true,
      fileId,
      streamUrl: dlData.result.url,
      name: dlData.result.name,
      size: dlData.result.size,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error resolving StreamTape stream',
    });
  }
}
