-- Allow all authenticated users to view admin roles (needed for village selection)
CREATE POLICY "Anyone can view admin roles"
ON public.user_roles
FOR SELECT
USING (role = 'admin');