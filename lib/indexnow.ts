export interface IndexNowPayload {
  tmdbId?: string | number;
  type?: 'movie' | 'tv' | 'anime';
  url?: string;
  urls?: string[];
}

export const INDEXNOW_KEY = process.env.NEXT_PUBLIC_INDEXNOW_KEY || 'Ranjit@29';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://auraflexmovies.vercel.app';

/**
 * Non-blocking helper function to trigger IndexNow instant indexing for newly added/updated movies
 */
export async function submitToIndexNow(payload: IndexNowPayload): Promise<{ success: boolean; submittedUrls?: string[] }> {
  try {
    const apiEndpoint = typeof window !== 'undefined'
      ? '/api/indexnow'
      : `${SITE_URL}/api/indexnow`;

    const res = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('IndexNow Trigger Error:', err);
    return { success: false };
  }
}
