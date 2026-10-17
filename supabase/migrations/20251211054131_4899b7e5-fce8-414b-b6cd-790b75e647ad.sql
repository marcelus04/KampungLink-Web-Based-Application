-- Create function to get all villages for admin view
CREATE OR REPLACE FUNCTION public.get_all_villages()
RETURNS TABLE(village_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT COALESCE(village, address) as village_name
  FROM public.profiles
  WHERE (village IS NOT NULL OR address IS NOT NULL)
    AND approval_status = 'approved'
  ORDER BY village_name
$$;

-- Create function to get announcements for a specific village (for admin cross-village view)
CREATE OR REPLACE FUNCTION public.get_village_announcements(_village text)
RETURNS TABLE(
  id uuid,
  title text,
  content text,
  category text,
  is_urgent boolean,
  created_at timestamptz,
  user_id uuid,
  image_url text,
  author_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.id,
    a.title,
    a.content,
    a.category,
    a.is_urgent,
    a.created_at,
    a.user_id,
    a.image_url,
    COALESCE(p.name, 'Admin') as author_name
  FROM announcements a
  INNER JOIN profiles p ON a.user_id = p.user_id
  WHERE p.village = _village OR p.address = _village
  ORDER BY a.is_urgent DESC NULLS LAST, a.created_at DESC
$$;