-- Supabase Database Migration for Stream Overrides Table

CREATE TABLE IF NOT EXISTS public.stream_overrides (
    tmdb_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'movie',
    custom_stream_url TEXT NOT NULL,
    backup_stream_url TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.stream_overrides ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active stream overrides
CREATE POLICY "Allow public read access to stream_overrides" 
ON public.stream_overrides 
FOR SELECT 
USING (true);

-- Allow authenticated users / admins full write access to stream_overrides
CREATE POLICY "Allow write access to stream_overrides" 
ON public.stream_overrides 
FOR ALL 
USING (true)
WITH CHECK (true);
