-- Allow users to view basic profile info of other approved users in their village
-- This is needed for the family invitation feature

CREATE POLICY "Users can view profiles from same village"
ON public.profiles FOR SELECT
TO authenticated
USING (
  village IS NOT NULL 
  AND village = (
    SELECT village FROM public.profiles WHERE user_id = auth.uid()
  )
  AND approval_status = 'approved'
);