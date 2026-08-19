export interface AniListMedia {
  id: number;
  title: {
    english?: string;
    romaji?: string;
  };
  coverImage: {
    extraLarge?: string;
    large?: string;
  };
  bannerImage?: string;
  description?: string;
  episodes?: number;
  averageScore?: number;
  genres: string[];
}

export const getAnimeDetails = async (id: string | number): Promise<AniListMedia | null> => {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  if (isNaN(numericId)) return null;

  const query = `
    query ($id: Int) {
      Media (id: $id, type: ANIME) {
        id
        title {
          english
          romaji
        }
        coverImage {
          extraLarge
          large
        }
        bannerImage
        description
        episodes
        averageScore
        genres
      }
    }
  `;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { id: numericId } }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.Media || null;
  } catch (err) {
    console.error('AniList fetch error:', err);
    return null;
  }
};
