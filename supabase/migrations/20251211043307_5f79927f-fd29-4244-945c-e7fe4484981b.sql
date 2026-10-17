-- Add gender column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN gender text CHECK (gender IN ('male', 'female'));

-- Add date_of_birth column for age demographics
ALTER TABLE public.profiles 
ADD COLUMN date_of_birth date;

-- Add occupation column for filtering
ALTER TABLE public.profiles 
ADD COLUMN occupation text;