const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '5f85fd51bf4325e76cad21aadfe1ecc6';
const TMDB_BASE_URL = process.env.EXPO_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = process.env.EXPO_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.EXPO_PUBLIC_SITE_URL ||
  'https://auraflexmovies.vercel.app';

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN ||
  process.env.EXPO_PUBLIC_TELEGRAM_BOT_TOKEN ||
  '8958801051:AAGjaBCjT4bysH0iFygBjRU-n4T2ucIldms';

const TELEGRAM_CHANNEL_HANDLE = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_ID || '@AuraFlexmovies';
const TELEGRAM_CHANNEL_LINK = 'https://t.me/AuraFlexmovies';

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
  10759: 'Action & Adventure',
  10762: 'Kids',
  10765: 'Sci-Fi & Fantasy',
  10768: 'War & Politics',
};

async function sendTelegramMessage(chatId, text, replyMarkup) {
  try {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
      reply_markup: replyMarkup,
    };
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error('[sendTelegramMessage Exception]', err);
    return { ok: false, error: err.message };
  }
}

async function sendTelegramPhoto(chatId, photoUrl, caption, replyMarkup) {
  try {
    const payload = {
      chat_id: chatId,
      photo: photoUrl,
      caption,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    };
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) {
      return await sendTelegramMessage(chatId, caption, replyMarkup);
    }
    return data;
  } catch (err) {
    console.error('[sendTelegramPhoto Exception]', err);
    return await sendTelegramMessage(chatId, caption, replyMarkup);
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function isUserChannelMember(userId) {
  try {
    if (!userId) return true;
    const channelId = TELEGRAM_CHANNEL_HANDLE || '@AuraFlexmovies';
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(
        channelId
      )}&user_id=${userId}`
    );
    const data = await res.json();
    if (!data.ok) {
      console.warn('[getChatMember warning]', data);
      return true; // Fallback to avoid blocking user if bot is not admin in channel
    }
    const status = data.result?.status;
    return ['creator', 'administrator', 'member', 'restricted'].includes(status);
  } catch (err) {
    console.error('[isUserChannelMember exception]', err);
    return true;
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
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      bot: 'AuraFlex Movies Auto-Reply Bot Webhook Handler',
      webhookUrl: `${SITE_URL}/api/telegram-webhook`,
      instructions: `To register this webhook with Telegram Bot API, visit: https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${SITE_URL}/api/telegram-webhook`,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const msg = body.message || body.edited_message || body.channel_post;

    if (!msg || !msg.chat) {
      return res.status(200).json({ ok: true, message: 'No chat object found' });
    }

    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const isPrivateChat = msg.chat.type === 'private';
    const rawText = (msg.text || msg.caption || '').trim();

    if (!rawText) {
      return res.status(200).json({ ok: true, message: 'No text content' });
    }

    if (/^\/(start|help)(\b|@)/i.test(rawText)) {
      const welcomeText = `🎬 <b>Welcome to AuraFlex Movies Search Bot!</b>

Send me any Movie or TV Show title (e.g. <code>Stree 2</code> or <code>/find Inception</code>) to get instant 1080p streaming links.

<b>How to search:</b>
• Direct message: Type <code>Movie Name</code> (e.g. <i>Stree 2</i>)
• Group chat: Type <code>/find Movie Name</code> (e.g. <i>/find Oppenheimer</i>)
• <code>/help</code> - Show search instructions

📢 Join our official channel <a href="${TELEGRAM_CHANNEL_LINK}">${TELEGRAM_CHANNEL_HANDLE}</a> for direct updates!`;

      const welcomeKeyboard = {
        inline_keyboard: [
          [
            { text: '📢 Join Official Channel', url: TELEGRAM_CHANNEL_LINK },
            { text: '🌐 Visit AuraFlex Movies', url: SITE_URL },
          ],
        ],
      };

      await sendTelegramMessage(chatId, welcomeText, welcomeKeyboard);
      return res.status(200).json({ ok: true, action: 'welcome' });
    }

    if (/^\/(broadcast|admin|settings|config|status|ping)(\b|@)/i.test(rawText)) {
      return res.status(200).json({ ok: true, action: 'ignored_admin_cmd' });
    }

    let searchQuery = rawText;
    const commandMatch = searchQuery.match(/^\/(find|search|movie|tv|query)(?:@[a-zA-Z0-9_]+)?\s+(.+)/i);
    if (commandMatch && commandMatch[2]) {
      searchQuery = commandMatch[2].trim();
    } else if (searchQuery.startsWith('/')) {
      searchQuery = searchQuery.replace(/^\/[a-zA-Z0-9_]+(?:@[a-zA-Z0-9_]+)?\s*/, '').trim();
    }

    if (!searchQuery || searchQuery.length < 2) {
      if (isPrivateChat) {
        await sendTelegramMessage(
          chatId,
          `🔍 Please enter a movie or TV show title to search (e.g. <code>Stree 2</code> or <code>/find Inception</code>).`
        );
      }
      return res.status(200).json({ ok: true, message: 'Query too short' });
    }

    // Force-Join Check for DM / Private Chats
    if (isPrivateChat && userId) {
      const isMember = await isUserChannelMember(userId);
      if (!isMember) {
        const joinNotice = `🔒 <b>Channel Membership Required</b>

To search and stream movies on AuraFlex Movies, you must join our official Telegram channel first!

1️⃣ Click <b>"📢 Join Official Channel"</b> below.
2️⃣ Click <b>Join</b> in <b>${TELEGRAM_CHANNEL_HANDLE}</b>.
3️⃣ Resend your movie title (e.g., <code>${escapeHtml(searchQuery)}</code>) to get instant streaming links!`;

        const joinKeyboard = {
          inline_keyboard: [
            [
              { text: '📢 Join Official Channel', url: TELEGRAM_CHANNEL_LINK },
            ],
            [
              { text: '🌐 Visit AuraFlex Website', url: SITE_URL },
            ],
          ],
        };

        await sendTelegramMessage(chatId, joinNotice, joinKeyboard);
        return res.status(200).json({ ok: true, action: 'force_join_required' });
      }
    }

    const tmdbRes = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(
        searchQuery
      )}&page=1`
    );

    if (!tmdbRes.ok) {
      await sendTelegramMessage(
        chatId,
        `⚠️ Search service currently unavailable. Please try again shortly or search on <a href="${SITE_URL}">${SITE_URL}</a>.`
      );
      return res.status(200).json({ ok: true, error: 'TMDB fetch failure' });
    }

    const searchData = await tmdbRes.json();
    const rawResults = searchData.results || [];
    const validResults = rawResults.filter(
      (item) =>
        item &&
        (item.media_type === 'movie' || item.media_type === 'tv') &&
        (item.title || item.name || item.original_title || item.original_name)
    );

    const topResults = validResults.slice(0, 3);

    if (topResults.length === 0) {
      const fallbackText = `❌ No stream found for '<b>${escapeHtml(
        searchQuery
      )}</b>'.\n\nJoin <a href="${TELEGRAM_CHANNEL_LINK}">${TELEGRAM_CHANNEL_HANDLE}</a> to request it!`;

      const fallbackKeyboard = {
        inline_keyboard: [
          [
            { text: '💬 Request on Telegram Channel', url: TELEGRAM_CHANNEL_LINK },
            { text: '🌐 Search on Website', url: `${SITE_URL}/search?q=${encodeURIComponent(searchQuery)}` },
          ],
        ],
      };

      await sendTelegramMessage(chatId, fallbackText, fallbackKeyboard);
      return res.status(200).json({ ok: true, action: 'no_results' });
    }

    for (const item of topResults) {
      const mediaType = item.media_type === 'tv' ? 'tv' : 'movie';
      const tmdbId = item.id;
      const title = item.title || item.name || item.original_title || item.original_name || 'Untitled';
      const year = (item.release_date || item.first_air_date || '').substring(0, 4);
      const rating = item.vote_average ? item.vote_average.toFixed(1) : '8.5';
      const posterPath = item.poster_path ? `${IMAGE_BASE_URL}/w500${item.poster_path}` : null;
      const genreIds = item.genre_ids || [];
      const genres = genreIds.map((id) => GENRE_MAP[id]).filter(Boolean);
      const genresText = genres.length > 0 ? genres.join(', ') : 'Action, Drama';

      const synopsis = item.overview
        ? item.overview.length > 180
          ? item.overview.substring(0, 180) + '...'
          : item.overview
        : 'Stream and download full HD release with high-speed direct links on AuraFlex Movies.';

      const watchUrl = `${SITE_URL}/watch/${mediaType}/${tmdbId}`;

      const caption = `🎬 <b>${escapeHtml(title)}${year ? ` (${year})` : ''}</b>

📊 <b>Rating:</b> ⭐ ${rating}/10 IMDb
🏷️ <b>Genres:</b> ${genresText}

📝 <b>Synopsis:</b>
<i>${escapeHtml(synopsis)}</i>

⚡ <b>Zero Popups • 1-Click Fast Stream & Direct Download</b>
🌐 <b>Watch Online:</b> <a href="${watchUrl}">${SITE_URL}</a>

💡 <i>Tip: Tap 3 dots (⋮) in top right ➔ 'Open in Chrome' for uninterrupted 1080p streaming.</i>`;

      const inlineKeyboard = {
        inline_keyboard: [
          [{ text: '▶️ Watch Full Movie in 1080p HD', url: watchUrl }],
          [
            { text: '⚡ Open in Chrome / Browser', url: watchUrl },
            { text: '📢 Telegram Channel', url: TELEGRAM_CHANNEL_LINK },
          ],
        ],
      };

      if (posterPath) {
        await sendTelegramPhoto(chatId, posterPath, caption, inlineKeyboard);
      } else {
        await sendTelegramMessage(chatId, caption, inlineKeyboard);
      }
    }

    return res.status(200).json({ ok: true, count: topResults.length });
  } catch (err) {
    console.error('[Telegram Webhook Exception]', err);
    return res.status(200).json({ ok: true, error: err.message || 'Server error' });
  }
}
