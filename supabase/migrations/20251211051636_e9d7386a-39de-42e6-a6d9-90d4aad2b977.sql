-- Drop existing restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles from same village" ON public.profiles;

-- Recreate as PERMISSIVE policies (OR logic - any one can grant access)
CREATE POLICY "Admin can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (has_admin_access(auth.uid()));

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view profiles from same village" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  village IS NOT NULL 
  AND village = get_user_village(auth.uid()) 
  AND approval_status = 'approved'
);