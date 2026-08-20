import { sendMovieToTelegram, TelegramBroadcastPayload } from '../../../../lib/telegram';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { tmdbId, query, type = 'movie', title, year, rating, audio, quality, genres, synopsis, posterUrl } = body;

    const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '5f85fd51bf4325e76cad21aadfe1ecc6';
    const TMDB_BASE_URL = process.env.EXPO_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
    const IMAGE_BASE_URL = process.env.EXPO_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

    const searchTarget = tmdbId || query;
    if (searchTarget && (!title || !posterUrl)) {
      if (/^\d+$/.test(String(searchTarget).trim())) {
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
            genres = raw.genres.map((g: any) => g.name);
          }
        }
      } else {
        const searchRes = await fetch(
          `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(
            searchTarget
          )}&page=1`
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const topResult = (searchData.results || []).find((i: any) => i.media_type !== 'person' && i.poster_path) || searchData.results?.[0];
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
          }
        }
      }
    }

    if (!title || !tmdbId) {
      return Response.json(
        { success: false, error: 'Could not resolve TMDB title or ID. Please check input.' },
        { status: 400 }
      );
    }

    const payload: TelegramBroadcastPayload = {
      tmdbId,
      title,
      year,
      rating,
      audio,
      quality,
      genres,
      synopsis,
      posterUrl,
      type: type as 'movie' | 'tv' | 'anime',
    };

    const res = await sendMovieToTelegram(payload);
    if (!res.success) {
      return Response.json({ success: false, error: res.error }, { status: 400 });
    }

    return Response.json({
      success: true,
      messageId: res.result?.message_id,
      title: title,
    });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
