-- Migration: Add StreamTape Embed URL and Direct Download URL to stream_overrides table
ALTER TABLE public.stream_overrides 
ADD COLUMN IF NOT EXISTS streamtape_url TEXT,
ADD COLUMN IF NOT EXISTS download_url TEXT;
