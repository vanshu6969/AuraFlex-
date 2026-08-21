import { supabase } from './supabase';
import { submitToIndexNow } from './indexnow';

export interface StreamOverrideRecord {
  tmdb_id: string;
  title: string;
  media_type: 'movie' | 'tv' | 'anime';
  custom_stream_url?: string | null;
  backup_stream_url?: string | null;
  streamtape_url?: string | null;
  download_url?: string | null;
  youtube_url?: string | null;
  updated_at?: string;
}

export const streamOverrideService = {
  /**
   * Fetch a single stream override by TMDB ID
   */
  async getOverride(tmdbId: string | number): Promise<StreamOverrideRecord | null> {
    if (!tmdbId) return null;
    try {
      const { data, error } = await supabase
        .from('stream_overrides')
        .select('*')
        .eq('tmdb_id', String(tmdbId))
        .maybeSingle();

      if (error || !data) return null;
      return data as StreamOverrideRecord;
    } catch (e) {
      return null;
    }
  },

  /**
   * Fetch all stream overrides (Admin view)
   */
  async getAllOverrides(): Promise<StreamOverrideRecord[]> {
    try {
      const { data, error } = await supabase
        .from('stream_overrides')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error || !data) return [];
      return data as StreamOverrideRecord[];
    } catch (e) {
      return [];
    }
  },

  /**
   * Upsert a stream URL override with any combination of link options
   */
  async upsertOverride(record: StreamOverrideRecord): Promise<{ success: boolean; error?: string }> {
    try {
      const payload = {
        tmdb_id: String(record.tmdb_id),
        title: record.title || 'Untitled Stream',
        media_type: record.media_type || 'movie',
        custom_stream_url: record.custom_stream_url || null,
        backup_stream_url: record.backup_stream_url || null,
        streamtape_url: record.streamtape_url || null,
        download_url: record.download_url || null,
        youtube_url: record.youtube_url || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('stream_overrides').upsert(payload);
      if (error) {
        return { success: false, error: error.message };
      }

      // Non-blocking automatic IndexNow trigger for instant Google/Bing/Yandex crawling
      submitToIndexNow({
        tmdbId: record.tmdb_id,
        type: record.media_type,
      }).catch(() => {});

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Unknown network error' };
    }
  },

  /**
   * Delete an override by TMDB ID
   */
  async deleteOverride(tmdbId: string | number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stream_overrides')
        .delete()
        .eq('tmdb_id', String(tmdbId));

      return !error;
    } catch (e) {
      return false;
    }
  },
};
