export interface KissKHDrama {
  id: number;
  title: string;
  thumbnail?: string;
}

export interface KissKHEpisode {
  id: number;
  number: number;
  sub: number;
}

export const kisskhService = {
  async getKissKHEmbedUrl(title: string, episode: number = 1): Promise<string | null> {
    try {
      // 1. Search for drama by title string
      const searchRes = await fetch(`https://kisskh.co/api/DramaList/Search?q=${encodeURIComponent(title)}`);
      if (!searchRes.ok) return null;
      const searchData = await searchRes.json();
      if (!Array.isArray(searchData) || searchData.length === 0) return null;

      const dramaId = searchData[0].id;

      // 2. Fetch episodes list for drama
      const dramaRes = await fetch(`https://kisskh.co/api/DramaList/Drama/${dramaId}?isSub=true`);
      if (!dramaRes.ok) return null;
      const dramaData = await dramaRes.json();

      if (dramaData && Array.isArray(dramaData.episodes)) {
        const ep = dramaData.episodes.find((e: any) => Number(e.number) === Number(episode)) || dramaData.episodes[0];
        if (ep && ep.id) {
          return `https://kisskh.co/ExternalEmbed?id=${ep.id}`;
        }
      }

      return null;
    } catch (e) {
      console.warn('KissKH API error:', e);
      return null;
    }
  },
};
