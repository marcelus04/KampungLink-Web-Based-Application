-- Drop the existing policy that only checks village column
DROP POLICY IF EXISTS "Users can view profiles from same village" ON public.profiles;

-- Create updated policy that includes both village residents AND admins with matching address
CREATE POLICY "Users can view profiles from same village" 
ON public.profiles 
FOR SELECT 
USING (
  (
    -- Same village (for residents)
    (village IS NOT NULL AND village = get_user_village(auth.uid()) AND approval_status = 'approved'::approval_status)
    OR
    -- Same address (for admins/JKKK whose village is stored in address)
    (address IS NOT NULL AND address = get_user_village(auth.uid()) AND approval_status = 'approved'::approval_status)
  )
);