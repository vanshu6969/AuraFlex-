import { safeStorage } from './storageAdapter';
import { storageService } from './storage';
import { tmdbService } from './tmdb';
import { WatchProgress } from '../types/media';

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export const notificationService = {
  async sendNativeNotification(title: string, body: string, icon?: string) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: icon || '/favicon.ico',
        });
      } catch (e) {
        console.warn('Native notification send error:', e);
      }
    }
  },

  async scheduleEngagingNotifications() {
    if (typeof window === 'undefined') return;

    // Check last notification sent timestamp to enforce 1-hour anti-spam gap
    const lastSentTimeStr = await safeStorage.getItem('auraflex_last_notif_time');
    const lastSentTime = lastSentTimeStr ? parseInt(lastSentTimeStr, 10) : 0;
    const now = Date.now();

    if (now - lastSentTime < ONE_HOUR_MS) {
      return; // Enforce strict 1-hour anti-spam gap
    }

    // 1. Check Unfinished Watch Progress Reminders (1 notification per movie with 1-hour gap)
    const progressList: WatchProgress[] = await storageService.getContinueWatching();
    const sentIdsStr = (await safeStorage.getItem('auraflex_notified_unfinished_ids')) || '[]';
    let notifiedIds: (string | number)[] = [];
    try {
      notifiedIds = JSON.parse(sentIdsStr);
    } catch (e) {
      notifiedIds = [];
    }

    const unfinishedItem = progressList.find((p: WatchProgress) => {
      const isUnfinished = p.currentTime > 60 && (p.duration <= 0 || p.duration - p.currentTime > 120);
      return isUnfinished && !notifiedIds.includes(p.mediaId);
    });

    if (unfinishedItem && unfinishedItem.media) {
      const minutesLeft = Math.max(1, Math.floor((unfinishedItem.duration - unfinishedItem.currentTime) / 60));
      const title = `🍿 Pick Up Where You Left Off!`;
      const body = `You have ${minutesLeft}m remaining in "${unfinishedItem.media.title}". Tap to continue watching on AuraFlex!`;

      await this.sendNativeNotification(title, body, unfinishedItem.media.poster_path);

      notifiedIds.push(unfinishedItem.mediaId);
      await safeStorage.setItem('auraflex_notified_unfinished_ids', JSON.stringify(notifiedIds));
      await safeStorage.setItem('auraflex_last_notif_time', now.toString());
      return;
    }

    // 2. Daily Trending Discovery Notification (Max once per 24h)
    const lastDailyTimeStr = await safeStorage.getItem('auraflex_last_daily_notif_time');
    const lastDailyTime = lastDailyTimeStr ? parseInt(lastDailyTimeStr, 10) : 0;

    if (now - lastDailyTime >= TWENTY_FOUR_HOURS_MS) {
      try {
        const trending = await tmdbService.getTrending();
        if (trending && trending.length > 0) {
          const featured = trending[Math.floor(Math.random() * Math.min(5, trending.length))];
          const title = `🔥 Daily Pick: ${featured.title}`;
          const body = `Trending today on AuraFlex: "${featured.title}". Stream in 4K Ultra HD!`;

          await this.sendNativeNotification(title, body, featured.poster_path);

          await safeStorage.setItem('auraflex_last_daily_notif_time', now.toString());
          await safeStorage.setItem('auraflex_last_notif_time', now.toString());
        }
      } catch (e) {
        console.warn('Daily notification fetch error:', e);
      }
    }
  },
};
