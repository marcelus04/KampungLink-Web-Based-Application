-- Function to get announcements by village (public access)
CREATE OR REPLACE FUNCTION public.get_public_announcements(_village text)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  category text,
  is_urgent boolean,
  created_at timestamptz,
  image_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.id,
    a.title,
    a.content,
    a.category,
    a.is_urgent,
    a.created_at,
    a.image_url
  FROM announcements a
  INNER JOIN profiles p ON a.user_id = p.user_id
  WHERE p.village = _village OR p.address = _village
  ORDER BY a.is_urgent DESC NULLS LAST, a.created_at DESC
  LIMIT 20;
$$;

-- Function to get marketplace items by village (public access)
CREATE OR REPLACE FUNCTION public.get_public_marketplace(_village text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price numeric,
  photo_url text,
  is_sold boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.id,
    m.title,
    m.description,
    m.price,
    m.photo_url,
    m.is_sold,
    m.created_at
  FROM marketplace_items m
  INNER JOIN profiles p ON m.user_id = p.user_id
  WHERE (p.village = _village OR p.address = _village)
    AND m.is_sold = false
  ORDER BY m.created_at DESC
  LIMIT 20;
$$;

-- Function to get fund requests by village (public access)
CREATE OR REPLACE FUNCTION public.get_public_fund_requests(_village text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  target_amount numeric,
  current_amount numeric,
  photo_url text,
  status text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    f.id,
    f.title,
    f.description,
    f.target_amount,
    f.current_amount,
    f.photo_url,
    f.status::text,
    f.created_at
  FROM fund_requests f
  INNER JOIN profiles p ON f.user_id = p.user_id
  WHERE (p.village = _village OR p.address = _village)
    AND f.status = 'active'
  ORDER BY f.created_at DESC
  LIMIT 20;
$$;