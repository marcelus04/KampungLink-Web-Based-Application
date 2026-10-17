-- Create a security definer function to get the user's village without recursion
CREATE OR REPLACE FUNCTION public.get_user_village(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT village FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles from same village" ON public.profiles;

-- Recreate the policy using the function instead of a subquery
CREATE POLICY "Users can view profiles from same village" 
ON public.profiles 
FOR SELECT 
USING (
  (village IS NOT NULL) 
  AND (village = get_user_village(auth.uid())) 
  AND (approval_status = 'approved'::approval_status)
);