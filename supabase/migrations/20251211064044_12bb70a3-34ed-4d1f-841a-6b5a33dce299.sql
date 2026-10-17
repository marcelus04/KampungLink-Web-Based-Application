-- Drop and recreate get_public_marketplace to include seller_id
DROP FUNCTION IF EXISTS public.get_public_marketplace(text);

CREATE OR REPLACE FUNCTION public.get_public_marketplace(_village text)
RETURNS TABLE(id uuid, title text, description text, price numeric, photo_url text, is_sold boolean, created_at timestamp with time zone, seller_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.id,
    m.title,
    m.description,
    m.price,
    m.photo_url,
    m.is_sold,
    m.created_at,
    m.user_id as seller_id
  FROM marketplace_items m
  INNER JOIN profiles p ON m.user_id = p.user_id
  WHERE (p.village = _village OR p.address = _village)
    AND m.is_sold = false
  ORDER BY m.created_at DESC
  LIMIT 20;
$$;