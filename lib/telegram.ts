export interface TelegramBroadcastPayload {
  tmdbId: string | number;
  title: string;
  year?: string | number;
  rating?: string | number;
  audio?: string;
  quality?: string;
  genres?: string[];
  synopsis?: string;
  posterUrl?: string;
  type?: 'movie' | 'tv' | 'anime';
}

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

export async function sendMovieToTelegram(
  movie: TelegramBroadcastPayload
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    const tmdbId = String(movie.tmdbId);
    const mediaType = movie.type || 'movie';
    const watchUrl = `${SITE_URL}/watch/${mediaType}/${tmdbId}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(watchUrl)}&text=${encodeURIComponent(
      `Watch ${movie.title} in 1080p Full HD on AuraFlex Movies!`
    )}`;
    const poster =
      movie.posterUrl ||
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';

    const titleText = movie.title ? movie.title.trim() : 'New Media Release';
    const yearText = movie.year ? ` (${movie.year})` : '';
    const ratingText = movie.rating ? `⭐ ${movie.rating} IMDb` : '⭐ 8.5 IMDb';
    const audioText = movie.audio || 'Hindi / Punjabi / Dual Audio';
    const qualityText = movie.quality || '1080p Full HD • Web-DL';
    const genresText = movie.genres && movie.genres.length > 0 ? movie.genres.join(', ') : 'Action, Drama';
    const overviewSnippet = movie.synopsis
      ? movie.synopsis.length > 180
        ? movie.synopsis.substring(0, 180) + '...'
        : movie.synopsis
      : 'Stream and download full HD release with high-speed direct links on AuraFlex Movies.';

    const caption = `🎬 <b>${titleText}${yearText}</b>

📊 <b>Rating:</b> ${ratingText}
🔊 <b>Audio:</b> ${audioText}
💿 <b>Quality:</b> ${qualityText}
🏷️ <b>Genres:</b> ${genresText}

📝 <b>Synopsis:</b>
<i>${overviewSnippet}</i>

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

    const payload = {
      chat_id: TELEGRAM_CHANNEL_ID,
      photo: poster,
      caption: caption,
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard,
    };

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('[Telegram Broadcast Error]', data);
      return {
        success: false,
        error: data.description || 'Failed to broadcast to Telegram. Please make sure the bot is an Administrator in the channel.',
      };
    }

    return { success: true, result: data.result };
  } catch (error: any) {
    console.error('[Telegram Broadcast Exception]', error);
    return { success: false, error: error.message || 'Unknown network error' };
  }
}

export async function sendTelegramPhotoToChat(
  chatId: string | number,
  photoUrl: string,
  caption: string,
  replyMarkup?: any
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    const payload = {
      chat_id: chatId,
      photo: photoUrl,
      caption,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    };

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('[Telegram sendPhoto Error]', data);
      return { success: false, error: data.description || 'Failed to send Telegram photo' };
    }
    return { success: true, result: data.result };
  } catch (error: any) {
    console.error('[Telegram sendPhoto Exception]', error);
    return { success: false, error: error.message || 'Network error' };
  }
}

export async function sendTelegramMessageToChat(
  chatId: string | number,
  text: string,
  replyMarkup?: any
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
      reply_markup: replyMarkup,
    };

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('[Telegram sendMessage Error]', data);
      return { success: false, error: data.description || 'Failed to send Telegram message' };
    }
    return { success: true, result: data.result };
  } catch (error: any) {
    console.error('[Telegram sendMessage Exception]', error);
    return { success: false, error: error.message || 'Network error' };
  }
}

