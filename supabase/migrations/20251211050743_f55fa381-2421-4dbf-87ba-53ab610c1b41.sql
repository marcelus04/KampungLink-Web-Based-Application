-- Add education_level column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education_level text;