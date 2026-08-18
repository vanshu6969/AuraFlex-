import { safeStorage } from './storageAdapter';
import { MediaItem, WatchProgress } from '../types/media';


import { supabase } from './supabase';

const LOCAL_WATCHLIST_KEY = '@vega_watchlist_store';
const LOCAL_PROGRESS_KEY = '@vega_continue_watching_store';

type StorageListener = () => void;
const listeners: Set<StorageListener> = new Set();

export const subscribeStorage = (listener: StorageListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyStorageChange = () => {
  listeners.forEach((fn) => fn());
};

export const storageService = {
  // Watchlist functions
  async getWatchlist(): Promise<MediaItem[]> {
    try {
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;

      if (user) {
        const { data, error } = await supabase
          .from('watchlist')
          .select('media_data')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((item) => item.media_data as MediaItem);
        }
      }
    } catch {
      // Fallback silently to safeStorage
    }

    try {
      const raw = await safeStorage.getItem(LOCAL_WATCHLIST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async addToWatchlist(media: MediaItem): Promise<boolean> {
    try {
      const existing = await this.getWatchlist();
      if (!existing.some((item) => String(item.id) === String(media.id))) {
        const updated = [media, ...existing];
        await safeStorage.setItem(LOCAL_WATCHLIST_KEY, JSON.stringify(updated));
      }
    } catch {}

    notifyStorageChange();

    try {
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;

      if (user) {
        await supabase.from('watchlist').upsert(
          {
            user_id: user.id,
            media_id: String(media.id),
            media_data: media,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,media_id' }
        );
      }
    } catch {}

    return true;
  },

  async removeFromWatchlist(mediaId: string | number): Promise<boolean> {
    try {
      const raw = await safeStorage.getItem(LOCAL_WATCHLIST_KEY);
      if (raw) {
        const parsed: MediaItem[] = JSON.parse(raw);
        const filtered = parsed.filter((item) => String(item.id) !== String(mediaId));
        await safeStorage.setItem(LOCAL_WATCHLIST_KEY, JSON.stringify(filtered));
      }
    } catch {}

    notifyStorageChange();

    try {
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;

      if (user) {
        await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('media_id', String(mediaId));
      }
    } catch {}

    return true;
  },

  async isInWatchlist(mediaId: string | number): Promise<boolean> {
    const list = await this.getWatchlist();
    return list.some((item) => String(item.id) === String(mediaId));
  },

  // Continue Watching progress functions
  async getContinueWatching(): Promise<WatchProgress[]> {
    try {
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;

      if (user) {
        const { data, error } = await supabase
          .from('watch_progress')
          .select('media_id, media_data, played_time, duration, season, episode, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((row) => {
            const mediaObj = row.media_data as MediaItem;
            const isMovie = mediaObj?.media_type === 'movie';
            return {
              mediaId: row.media_id,
              media: mediaObj,
              season: isMovie ? undefined : (row.season || 1),
              episode: isMovie ? undefined : (row.episode || 1),
              currentTime: Number(row.played_time || 0),
              duration: Number(row.duration || 0),
              updatedAt: new Date(row.updated_at).getTime(),
            };
          });
        }
      }
    } catch {}

    try {
      const raw = await safeStorage.getItem(LOCAL_PROGRESS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async saveProgress(



    media: MediaItem,
    currentTime: number,
    duration: number,
    season = 1,
    episode = 1
  ): Promise<void> {
    const progressItem: WatchProgress = {
      mediaId: media.id,
      media,
      season,
      episode,
      currentTime,
      duration,
      updatedAt: Date.now(),
    };

    try {
      const raw = await safeStorage.getItem(LOCAL_PROGRESS_KEY);
      let list: WatchProgress[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((item) => String(item.mediaId) === String(media.id));

      if (idx !== -1) {
        list[idx] = progressItem;
      } else {
        list.unshift(progressItem);
      }

      await safeStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(list));
    } catch {}

    notifyStorageChange();

    try {
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;

      if (user) {
        await supabase.from('watch_progress').upsert(
          {
            user_id: user.id,
            media_id: String(media.id),
            media_data: media,
            played_time: currentTime,
            duration: duration,
            season: season,
            episode: episode,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,media_id,season,episode' }
        );
      }
    } catch {}
  },

  async removeProgress(mediaId: string | number): Promise<void> {
    try {
      const raw = await safeStorage.getItem(LOCAL_PROGRESS_KEY);
      if (raw) {
        const list: WatchProgress[] = JSON.parse(raw);
        const filtered = list.filter((item) => String(item.mediaId) !== String(mediaId));
        await safeStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(filtered));
      }
    } catch {}

    try {
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;
      if (user) {
        await supabase
          .from('watch_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('media_id', String(mediaId));
      }
    } catch {}

    notifyStorageChange();
  },

  async clearHistory(): Promise<boolean> {
    try {
      await safeStorage.removeItem(LOCAL_PROGRESS_KEY);
    } catch {}

    try {
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;

      if (user) {
        await supabase
          .from('watch_progress')
          .delete()
          .eq('user_id', user.id);
      }
    } catch {}

    notifyStorageChange();
    return true;
  },


  // Sync offline storage with Supabase upon login
  async syncLocalToSupabase(): Promise<void> {
    try {
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;
      if (!user) return;

      // Sync local watchlist
      const rawWatchlist = await safeStorage.getItem(LOCAL_WATCHLIST_KEY);
      if (rawWatchlist) {
        const localItems: MediaItem[] = JSON.parse(rawWatchlist);
        for (const item of localItems) {
          await supabase.from('watchlist').upsert(
            {
              user_id: user.id,
              media_id: String(item.id),
              media_data: item,
              created_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,media_id' }
          );
        }
      }

      // Sync local watch progress
      const rawProgress = await safeStorage.getItem(LOCAL_PROGRESS_KEY);
      if (rawProgress) {
        const localProgress: WatchProgress[] = JSON.parse(rawProgress);
        for (const p of localProgress) {
          await supabase.from('watch_progress').upsert(
            {
              user_id: user.id,
              media_id: String(p.mediaId),
              media_data: p.media,
              played_time: p.currentTime,
              duration: p.duration,
              season: p.season,
              episode: p.episode,
              updated_at: new Date(p.updatedAt).toISOString(),
            },
            { onConflict: 'user_id,media_id,season,episode' }
          );
        }
      }

      notifyStorageChange();
    } catch (e) {
      console.warn('Sync local to Supabase failed:', e);
    }
  },

  // Server and Watch State Persistence
  async getPreferredServer(): Promise<string | null> {
    try {
      return await safeStorage.getItem('@auraflex_preferred_server');
    } catch {
      return null;
    }
  },

  async setPreferredServer(serverId: string): Promise<void> {
    try {
      await safeStorage.setItem('@auraflex_preferred_server', serverId);
    } catch {}
  },

  async getMediaWatchState(mediaId: string | number): Promise<{ season?: number; episode?: number; serverId?: string } | null> {
    try {
      const raw = await safeStorage.getItem(`@auraflex_state_${mediaId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async saveMediaWatchState(mediaId: string | number, state: { season?: number; episode?: number; serverId?: string }): Promise<void> {
    try {
      await safeStorage.setItem(`@auraflex_state_${mediaId}`, JSON.stringify(state));
    } catch {}
  },
};

