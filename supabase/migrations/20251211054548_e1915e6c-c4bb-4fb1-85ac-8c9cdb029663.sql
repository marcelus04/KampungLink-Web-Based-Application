-- Create function to get Ketua Kampung for a village
CREATE OR REPLACE FUNCTION public.get_village_ketua(_village text)
RETURNS TABLE(ketua_name text, ketua_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.name as ketua_name, p.user_id as ketua_id
  FROM profiles p
  INNER JOIN user_roles ur ON p.user_id = ur.user_id
  WHERE ur.role = 'admin'
    AND p.address = _village
    AND p.approval_status = 'approved'
  LIMIT 1
$$;

-- Create function to get all announcements with village and ketua info
CREATE OR REPLACE FUNCTION public.get_all_announcements_with_villages()
RETURNS TABLE(
  id uuid,
  title text,
  content text,
  category text,
  is_urgent boolean,
  created_at timestamptz,
  user_id uuid,
  image_url text,
  author_name text,
  village_name text
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
    COALESCE(p.name, 'Admin') as author_name,
    COALESCE(p.village, p.address) as village_name
  FROM announcements a
  INNER JOIN profiles p ON a.user_id = p.user_id
  ORDER BY a.is_urgent DESC NULLS LAST, a.created_at DESC
$$;