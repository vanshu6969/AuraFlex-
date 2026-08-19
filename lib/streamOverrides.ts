import { supabase } from './supabase';

export interface StreamOverrideRecord {
  tmdb_id: string;
  title: string;
  media_type: 'movie' | 'tv' | 'anime';
  custom_stream_url: string;
  backup_stream_url?: string | null;
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
   * Upsert a custom stream URL override
   */
  async upsertOverride(record: StreamOverrideRecord): Promise<boolean> {
    try {
      const payload = {
        tmdb_id: String(record.tmdb_id),
        title: record.title || 'Untitled Stream',
        media_type: record.media_type || 'movie',
        custom_stream_url: record.custom_stream_url,
        backup_stream_url: record.backup_stream_url || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('stream_overrides')
        .upsert(payload, { onConflict: 'tmdb_id' });

      if (error) {
        console.error('Failed to upsert stream override:', error);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Delete an override entry
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
