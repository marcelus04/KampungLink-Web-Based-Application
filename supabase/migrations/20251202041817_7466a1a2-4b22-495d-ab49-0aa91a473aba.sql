-- Create function to check for admin-like access (admin or jkkk)
CREATE OR REPLACE FUNCTION public.has_admin_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'jkkk')
  )
$$;

-- Allow anyone to view admin and jkkk roles (needed for village selection)
DROP POLICY IF EXISTS "Anyone can view admin roles" ON public.user_roles;
CREATE POLICY "Anyone can view admin or jkkk roles"
ON public.user_roles
FOR SELECT
USING (role IN ('admin', 'jkkk'));