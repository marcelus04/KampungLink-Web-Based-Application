-- Create a function to get public village list (for guest access)
CREATE OR REPLACE FUNCTION public.get_public_villages()
RETURNS TABLE(village_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT COALESCE(village, address) as village_name
  FROM public.profiles
  WHERE village IS NOT NULL OR address IS NOT NULL
$$;