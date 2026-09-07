-- FocusTrack Phase M6.1.2
-- Add archived_at and archived_intervals columns to public.habits for durable archive boundary tracking.

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_intervals JSONB DEFAULT '[]'::jsonb;
