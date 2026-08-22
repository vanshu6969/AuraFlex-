const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '5f85fd51bf4325e76cad21aadfe1ecc6';
const TMDB_BASE_URL = process.env.EXPO_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = process.env.EXPO_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN ||
  process.env.EXPO_PUBLIC_TELEGRAM_BOT_TOKEN ||
  '8958801051:AAGjaBCjT4bysH0iFygBjRU-n4T2ucIldms';

const TELEGRAM_CHANNEL_ID =
  process.env.TELEGRAM_CHANNEL_ID ||
  process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_ID ||
  process.env.EXPO_PUBLIC_TELEGRAM_CHANNEL_ID ||
  '@AuraFlexmovies';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.EXPO_PUBLIC_SITE_URL ||
  'https://auraflexmovies.vercel.app';

const GENRE_MAP = {
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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    let { tmdbId, query, type = 'movie', title, year, rating, audio, quality, genres, synopsis, posterUrl } = body;

    // If query or tmdbId is passed without full details, fetch from TMDB
    const searchTarget = tmdbId || query;
    if (searchTarget && (!title || !posterUrl)) {
      if (/^\d+$/.test(String(searchTarget).trim())) {
        // Numeric TMDB ID
        const targetType = type === 'tv' || type === 'anime' ? 'tv' : 'movie';
        const tmdbRes = await fetch(`${TMDB_BASE_URL}/${targetType}/${searchTarget}?api_key=${TMDB_API_KEY}&language=en-US`);
        if (tmdbRes.ok) {
          const raw = await tmdbRes.json();
          tmdbId = raw.id;
          title = raw.title || raw.name || raw.original_title || raw.original_name;
          year = (raw.release_date || raw.first_air_date || '2026').substring(0, 4);
          rating = raw.vote_average ? raw.vote_average.toFixed(1) : '8.5';
          synopsis = raw.overview || synopsis;
          if (raw.poster_path) {
            posterUrl = `${IMAGE_BASE_URL}/w500${raw.poster_path}`;
          }
          if (raw.genres && Array.isArray(raw.genres)) {
            genres = raw.genres.map((g) => g.name);
          }
        }
      } else {
        // Text title query (e.g. "Shera" or "Kanneda")
        const searchRes = await fetch(
          `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(
            searchTarget
          )}&page=1`
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const topResult = (searchData.results || []).find((i) => i.media_type !== 'person' && i.poster_path) || searchData.results?.[0];
          if (topResult) {
            tmdbId = topResult.id;
            type = topResult.media_type || type;
            title = topResult.title || topResult.name || topResult.original_title || topResult.original_name;
            year = (topResult.release_date || topResult.first_air_date || '2026').substring(0, 4);
            rating = topResult.vote_average ? topResult.vote_average.toFixed(1) : '8.5';
            synopsis = topResult.overview || synopsis;
            if (topResult.poster_path) {
              posterUrl = `${IMAGE_BASE_URL}/w500${topResult.poster_path}`;
            }
            if (topResult.genre_ids && Array.isArray(topResult.genre_ids)) {
              genres = topResult.genre_ids.map((id) => GENRE_MAP[id]).filter(Boolean);
            }
          }
        }
      }
    }

    if (!title || !tmdbId) {
      return res.status(400).json({ success: false, error: 'Could not resolve TMDB title or ID. Please check movie name / TMDB ID.' });
    }

    const mediaType = type === 'tv' || type === 'anime' ? 'tv' : 'movie';
    const watchUrl = `${SITE_URL}/watch/${mediaType}/${tmdbId}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(watchUrl)}&text=${encodeURIComponent(
      `Watch ${title} in 1080p Full HD on AuraFlex Movies!`
    )}`;
    const finalPoster = posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';

    const titleText = title.trim();
    const yearText = year ? ` (${year})` : '';
    const ratingText = rating ? `⭐ ${rating} IMDb` : '⭐ 8.5 IMDb';
    const audioText = audio || 'Hindi / Punjabi / Dual Audio';
    const qualityText = quality || '1080p Full HD • Web-DL';
    const genresText = genres && genres.length > 0 ? genres.join(', ') : 'Action, Drama';
    const overviewSnippet = synopsis
      ? synopsis.length > 180
        ? synopsis.substring(0, 180) + '...'
        : synopsis
      : 'Stream and download full HD release with high-speed direct links on AuraFlex Movies.';

    const caption = `🎬 <b>${titleText}${yearText}</b>

📊 <b>Rating:</b> ${ratingText}
🔊 <b>Audio:</b> ${audioText}
💿 <b>Quality:</b> ${qualityText}
🏷️ <b>Genres:</b> ${genresText}

📝 <b>Synopsis:</b>
<i>${overviewSnippet}</i>

⚡ <b>Zero Popups • 1-Click Fast Stream & Direct Download</b>
🌐 <b>Watch Online:</b> <a href="${watchUrl}">${SITE_URL}</a>`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: '▶️ Watch Full Movie (1080p HD)',
            url: watchUrl,
          },
        ],
        [
          {
            text: '📥 Direct Download',
            url: watchUrl,
          },
          {
            text: '⚡ Share to Friends',
            url: shareUrl,
          },
        ],
      ],
    };

    const telegramPayload = {
      chat_id: TELEGRAM_CHANNEL_ID,
      photo: finalPoster,
      caption: caption,
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard,
    };

    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(telegramPayload),
    });

    const tgData = await tgRes.json();
    if (!tgData.ok) {
      console.error('[Telegram API Error]', tgData);
      return res.status(400).json({
        success: false,
        error: tgData.description || 'Failed to post message to Telegram channel. Make sure bot is an admin of @AuraFlexmovies.',
      });
    }

    return res.status(200).json({
      success: true,
      messageId: tgData.result?.message_id,
      title: titleText,
      watchUrl: watchUrl,
      channel: TELEGRAM_CHANNEL_ID,
    });
  } catch (err) {
    console.error('Telegram Broadcast Exception:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error during Telegram broadcast',
    });
  }
}
