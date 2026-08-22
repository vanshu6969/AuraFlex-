import { sendTelegramMessageToChat, sendTelegramPhotoToChat } from '../../../../lib/telegram';

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '5f85fd51bf4325e76cad21aadfe1ecc6';
const TMDB_BASE_URL = process.env.EXPO_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = process.env.EXPO_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.EXPO_PUBLIC_SITE_URL ||
  'https://auraflexmovies.vercel.app';

const TELEGRAM_CHANNEL_HANDLE = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_ID || '@AuraFlexmovies';
const TELEGRAM_CHANNEL_LINK = 'https://t.me/AuraFlexmovies';

const GENRE_MAP: Record<number, string> = {
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

// GET handler for Webhook Status Check & Easy Registration Info
export async function GET() {
  return Response.json({
    status: 'online',
    bot: 'AuraFlex Movies Auto-Reply Bot Webhook Handler',
    webhookUrl: `${SITE_URL}/api/telegram/webhook`,
    instructions: `To register this webhook with Telegram Bot API, visit: https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=${SITE_URL}/api/telegram/webhook`,
  });
}

// POST handler for incoming Telegram Bot Updates
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json({ ok: true, message: 'Invalid payload' });
    }

    // Extract message object from Update (message, edited_message, or channel_post)
    const msg = body.message || body.edited_message || body.channel_post;
    if (!msg || !msg.chat) {
      return Response.json({ ok: true, message: 'No chat object found' });
    }

    const chatId = msg.chat.id;
    const rawText = (msg.text || msg.caption || '').trim();

    if (!rawText) {
      return Response.json({ ok: true, message: 'No text content' });
    }

    // Handle /start or /help commands
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
            {
              text: '🌐 Visit AuraFlex Movies',
              url: SITE_URL,
            },
            {
              text: '📢 Official Channel',
              url: TELEGRAM_CHANNEL_LINK,
            },
          ],
        ],
      };

      await sendTelegramMessageToChat(chatId, welcomeText, welcomeKeyboard);
      return Response.json({ ok: true, action: 'welcome' });
    }

    // Ignore administrative non-search commands (e.g. /broadcast, /settings, /admin)
    if (/^\/(broadcast|admin|settings|config|status|ping)(\b|@)/i.test(rawText)) {
      return Response.json({ ok: true, action: 'ignored_admin_cmd' });
    }

    // Extract search query string
    let searchQuery = rawText;

    // Strip leading /find, /search, /movie, /tv command prefixes (e.g. "/find Stree 2", "/find@BotName Stree 2")
    const commandMatch = searchQuery.match(/^\/(find|search|movie|tv|query)(?:@[a-zA-Z0-9_]+)?\s+(.+)/i);
    if (commandMatch && commandMatch[2]) {
      searchQuery = commandMatch[2].trim();
    } else if (searchQuery.startsWith('/')) {
      // If it's a command like "/find" without arguments or unknown command
      searchQuery = searchQuery.replace(/^\/[a-zA-Z0-9_]+(?:@[a-zA-Z0-9_]+)?\s*/, '').trim();
    }

    // If no search query remains after stripping commands, prompt the user
    if (!searchQuery || searchQuery.length < 2) {
      if (msg.chat.type === 'private') {
        await sendTelegramMessageToChat(
          chatId,
          `🔍 Please enter a movie or TV show title to search (e.g. <code>Stree 2</code> or <code>/find Inception</code>).`
        );
      }
      return Response.json({ ok: true, message: 'Query too short' });
    }

    // Fetch matching media items from TMDB API
    const tmdbRes = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(
        searchQuery
      )}&page=1`
    );

    if (!tmdbRes.ok) {
      console.error('[Telegram Webhook] TMDB API response not OK:', tmdbRes.status);
      await sendTelegramMessageToChat(
        chatId,
        `⚠️ Search service currently unavailable. Please try again shortly or search on <a href="${SITE_URL}">${SITE_URL}</a>.`
      );
      return Response.json({ ok: true, error: 'TMDB fetch failure' });
    }

    const searchData = await tmdbRes.json();
    const rawResults = searchData.results || [];

    // Filter valid media items (movies or tv shows, excluding person results)
    const validResults = rawResults.filter(
      (item: any) =>
        item &&
        (item.media_type === 'movie' || item.media_type === 'tv') &&
        (item.title || item.name || item.original_title || item.original_name)
    );

    // Pick top 1 to 3 results
    const topResults = validResults.slice(0, 3);

    if (topResults.length === 0) {
      const fallbackText = `❌ No stream found for '<b>${escapeHtml(
        searchQuery
      )}</b>'.\n\nJoin <a href="${TELEGRAM_CHANNEL_LINK}">${TELEGRAM_CHANNEL_HANDLE}</a> to request it!`;

      const fallbackKeyboard = {
        inline_keyboard: [
          [
            {
              text: '💬 Request on Telegram Channel',
              url: TELEGRAM_CHANNEL_LINK,
            },
            {
              text: '🌐 Search on Website',
              url: `${SITE_URL}/search?q=${encodeURIComponent(searchQuery)}`,
            },
          ],
        ],
      };

      await sendTelegramMessageToChat(chatId, fallbackText, fallbackKeyboard);
      return Response.json({ ok: true, action: 'no_results' });
    }

    // Send results (top 1-3 items) to the user / group chat
    for (const item of topResults) {
      const mediaType = item.media_type === 'tv' ? 'tv' : 'movie';
      const tmdbId = item.id;
      const title = item.title || item.name || item.original_title || item.original_name || 'Untitled';
      const year = (item.release_date || item.first_air_date || '').substring(0, 4);
      const rating = item.vote_average ? item.vote_average.toFixed(1) : '8.5';
      const posterPath = item.poster_path ? `${IMAGE_BASE_URL}/w500${item.poster_path}` : null;

      const genreIds: number[] = item.genre_ids || [];
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
🌐 <b>Watch Online:</b> <a href="${watchUrl}">${SITE_URL}</a>`;

      const inlineKeyboard = {
        inline_keyboard: [
          [
            {
              text: '▶️ Watch Full Movie in 1080p HD',
              url: watchUrl,
            },
          ],
          [
            {
              text: '⚡ Open in Chrome / Browser',
              url: watchUrl,
            },
            {
              text: '📢 Telegram Channel',
              url: TELEGRAM_CHANNEL_LINK,
            },
          ],
        ],
      };

      if (posterPath) {
        const photoRes = await sendTelegramPhotoToChat(chatId, posterPath, caption, inlineKeyboard);
        if (!photoRes.success) {
          // Fallback to text message if photo sending fails
          await sendTelegramMessageToChat(chatId, caption, inlineKeyboard);
        }
      } else {
        await sendTelegramMessageToChat(chatId, caption, inlineKeyboard);
      }
    }

    return Response.json({ ok: true, count: topResults.length });
  } catch (error: any) {
    console.error('[Telegram Webhook Error]', error);
    // Always return HTTP 200 to prevent Telegram from repeating failed webhook calls
    return Response.json({ ok: true, error: error?.message || 'Server error' });
  }
}

// Utility function to escape HTML special characters for Telegram HTML parse mode
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
