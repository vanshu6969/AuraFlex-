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
          .eq('user_id', user.id);

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
        await supabase.from('watchlist').upsert({
          user_id: user.id,
          media_id: String(media.id),
          media_data: media,
          created_at: new Date().toISOString(),
        });
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
          .select('progress_data')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (!error && data) {
          return data.map((item) => item.progress_data as WatchProgress);
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
        await supabase.from('watch_progress').upsert({
          user_id: user.id,
          media_id: String(media.id),
          progress_data: progressItem,
          updated_at: new Date().toISOString(),
        });
      }
    } catch {}
  },

  async clearHistory(): Promise<boolean> {
    try {
      await safeStorage.removeItem(LOCAL_PROGRESS_KEY);
    } catch {}

    notifyStorageChange();

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

    return true;
  },
};

