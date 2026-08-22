import {
  sendTelegramMessageToChat,
  sendTelegramPhotoToChat,
  answerTelegramCallbackQuery,
} from '../../../../lib/telegram';

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

// Helper to check channel membership via Telegram getChatMember API
async function isUserChannelMember(userId: number | string): Promise<boolean> {
  try {
    if (!userId) return true;
    const botToken =
      process.env.TELEGRAM_BOT_TOKEN ||
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN ||
      process.env.EXPO_PUBLIC_TELEGRAM_BOT_TOKEN ||
      '8958801051:AAGjaBCjT4bysH0iFygBjRU-n4T2ucIldms';
    const channelId = TELEGRAM_CHANNEL_HANDLE || '@AuraFlexmovies';
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(
        channelId
      )}&user_id=${userId}`
    );
    const data = await res.json();
    if (!data.ok) return true;
    const status = data.result?.status;
    return ['creator', 'administrator', 'member', 'restricted'].includes(status);
  } catch {
    return true;
  }
}

// POST handler for incoming Telegram Bot Updates (Text Messages & Callback Button Clicks)
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json({ ok: true, message: 'Invalid payload' });
    }

    // ----------------------------------------------------
    // 1. HANDLE BUTTON SELECTION CALLBACK QUERIES
    // ----------------------------------------------------
    if (body.callback_query) {
      const cb = body.callback_query;
      const callbackId = cb.id;
      const chatId = cb.message?.chat?.id;
      const callbackData = (cb.data || '').trim();

      // Immediately acknowledge callback query to stop button loading spinner
      await answerTelegramCallbackQuery(callbackId);

      if (chatId && callbackData.startsWith('select_')) {
        const parts = callbackData.split('_');
        const rawType = parts[1];
        const tmdbId = parts[2];
        const mediaType = rawType === 'tv' ? 'tv' : 'movie';

        if (tmdbId) {
          // Fetch detailed movie/TV info from TMDB API
          const tmdbRes = await fetch(
            `${TMDB_BASE_URL}/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`
          );

          if (tmdbRes.ok) {
            const raw = await tmdbRes.json();
            const title = raw.title || raw.name || raw.original_title || raw.original_name || 'Untitled';
            const year = (raw.release_date || raw.first_air_date || '').substring(0, 4);
            const rating = raw.vote_average ? raw.vote_average.toFixed(1) : '8.5';
            const posterPath = raw.poster_path ? `${IMAGE_BASE_URL}/w500${raw.poster_path}` : null;
            const genres = raw.genres ? raw.genres.map((g: any) => g.name) : ['Action', 'Drama'];
            const genresText = genres.length > 0 ? genres.join(', ') : 'Action, Drama';

            const synopsis = raw.overview
              ? raw.overview.length > 200
                ? raw.overview.substring(0, 200) + '...'
                : raw.overview
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
                [
                  {
                    text: '▶️ Watch Full Movie (1080p HD)',
                    url: watchUrl,
                  },
                ],
                [
                  {
                    text: '📥 Direct 1-Click Download',
                    url: watchUrl,
                  },
                ],
                [
                  {
                    text: '🌐 Visit Website',
                    url: SITE_URL,
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
                await sendTelegramMessageToChat(chatId, caption, inlineKeyboard);
              }
            } else {
              await sendTelegramMessageToChat(chatId, caption, inlineKeyboard);
            }

            return Response.json({ ok: true, action: 'callback_item_sent' });
          }
        }
      }

      return Response.json({ ok: true, action: 'callback_handled' });
    }

    // ----------------------------------------------------
    // 2. HANDLE SEARCH TEXT UPDATES & COMMANDS
    // ----------------------------------------------------
    const msg = body.message || body.edited_message || body.channel_post;
    if (!msg || !msg.chat) {
      return Response.json({ ok: true, message: 'No chat object found' });
    }

    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const isPrivateChat = msg.chat.type === 'private';
    const rawText = (msg.text || msg.caption || '').trim();

    if (!rawText) {
      return Response.json({ ok: true, message: 'No text content' });
    }

    // Handle /start or /help commands
    if (/^\/(start|help)(\b|@)/i.test(rawText)) {
      const welcomeText = `🎬 <b>Welcome to AuraFlex Movies Search Bot!</b>

Send me any Movie or TV Show title (e.g. <code>Stree 2</code> or <code>Spiderman</code>) to get instant 1080p streaming links.

<b>How to search:</b>
• Direct message: Type <code>Movie Name</code> (e.g. <i>Spiderman</i>)
• Group chat: Type <code>/find Movie Name</code> (e.g. <i>/find Oppenheimer</i>)
• <code>/help</code> - Show search instructions

📢 Join our official channel <a href="${TELEGRAM_CHANNEL_LINK}">${TELEGRAM_CHANNEL_HANDLE}</a> for direct updates!`;

      const welcomeKeyboard = {
        inline_keyboard: [
          [
            {
              text: '📢 Join Official Channel',
              url: TELEGRAM_CHANNEL_LINK,
            },
            {
              text: '🌐 Visit AuraFlex Movies',
              url: SITE_URL,
            },
          ],
        ],
      };

      await sendTelegramMessageToChat(chatId, welcomeText, welcomeKeyboard);
      return Response.json({ ok: true, action: 'welcome' });
    }

    // Ignore administrative non-search commands
    if (/^\/(broadcast|admin|settings|config|status|ping)(\b|@)/i.test(rawText)) {
      return Response.json({ ok: true, action: 'ignored_admin_cmd' });
    }

    let searchQuery = rawText;

    // Strip leading /find, /search, /movie, /tv command prefixes
    const commandMatch = searchQuery.match(/^\/(find|search|movie|tv|query)(?:@[a-zA-Z0-9_]+)?\s+(.+)/i);
    if (commandMatch && commandMatch[2]) {
      searchQuery = commandMatch[2].trim();
    } else if (searchQuery.startsWith('/')) {
      searchQuery = searchQuery.replace(/^\/[a-zA-Z0-9_]+(?:@[a-zA-Z0-9_]+)?\s*/, '').trim();
    }

    if (!searchQuery || searchQuery.length < 2) {
      if (isPrivateChat) {
        await sendTelegramMessageToChat(
          chatId,
          `🔍 Please enter a movie or TV show title to search (e.g. <code>Spiderman</code> or <code>/find Inception</code>).`
        );
      }
      return Response.json({ ok: true, message: 'Query too short' });
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
            [{ text: '📢 Join Official Channel', url: TELEGRAM_CHANNEL_LINK }],
            [{ text: '🌐 Visit AuraFlex Website', url: SITE_URL }],
          ],
        };

        await sendTelegramMessageToChat(chatId, joinNotice, joinKeyboard);
        return Response.json({ ok: true, action: 'force_join_required' });
      }
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

    // Get top 5 results for choice selection
    const topResults = validResults.slice(0, 5);

    // 0 Matches
    if (topResults.length === 0) {
      const fallbackText = `❌ No stream found for "<b>${escapeHtml(
        searchQuery
      )}</b>".\n\nJoin <a href="${TELEGRAM_CHANNEL_LINK}">${TELEGRAM_CHANNEL_HANDLE}</a> to request it!`;

      const fallbackKeyboard = {
        inline_keyboard: [
          [
            { text: '💬 Request on Telegram Channel', url: TELEGRAM_CHANNEL_LINK },
            { text: '🌐 Search on Website', url: `${SITE_URL}/search?q=${encodeURIComponent(searchQuery)}` },
          ],
        ],
      };

      await sendTelegramMessageToChat(chatId, fallbackText, fallbackKeyboard);
      return Response.json({ ok: true, action: 'no_results' });
    }

    // 1 Exact Match: Send Movie Card directly
    if (topResults.length === 1) {
      const item = topResults[0];
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
        ? item.overview.length > 200
          ? item.overview.substring(0, 200) + '...'
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
          [
            {
              text: '▶️ Watch Full Movie (1080p HD)',
              url: watchUrl,
            },
          ],
          [
            {
              text: '📥 Direct 1-Click Download',
              url: watchUrl,
            },
          ],
          [
            {
              text: '🌐 Visit Website',
              url: SITE_URL,
            },
            {
              text: '📢 Telegram Channel',
              url: TELEGRAM_CHANNEL_LINK,
            },
          ],
        ],
      };

      if (posterPath) {
        await sendTelegramPhotoToChat(chatId, posterPath, caption, inlineKeyboard);
      } else {
        await sendTelegramMessageToChat(chatId, caption, inlineKeyboard);
      }

      return Response.json({ ok: true, action: 'single_match_sent' });
    }

    // Multiple Matches (2 to 5 results): Send Single Selection List with Inline Buttons
    const listText = `🔍 Found <b>${topResults.length}</b> results for "<b>${escapeHtml(
      searchQuery
    )}</b>". Select your movie/show below:`;

    const buttonRows = topResults.map((item: any) => {
      const title = item.title || item.name || item.original_title || item.original_name || 'Untitled';
      const year = (item.release_date || item.first_air_date || '').substring(0, 4);
      const rating = item.vote_average ? item.vote_average.toFixed(1) : '8.5';
      const typeTag = item.media_type === 'tv' ? 'TV' : 'Movie';
      const yearStr = year ? ` (${year})` : '';

      return [
        {
          text: `🎬 ${title}${yearStr} • ⭐ ${rating} [${typeTag}]`,
          callback_data: `select_${item.media_type || 'movie'}_${item.id}`,
        },
      ];
    });

    const selectionKeyboard = {
      inline_keyboard: buttonRows,
    };

    await sendTelegramMessageToChat(chatId, listText, selectionKeyboard);
    return Response.json({ ok: true, action: 'selection_list_sent', count: topResults.length });
  } catch (error: any) {
    console.error('[Telegram Webhook Error]', error);
    return Response.json({ ok: true, error: error?.message || 'Server error' });
  }
}

// Utility function to escape HTML special characters for Telegram HTML parse mode
function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
