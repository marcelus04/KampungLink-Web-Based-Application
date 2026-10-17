-- Allow family members to view families they belong to
CREATE POLICY "Family members can view their family"
ON public.families
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_members.family_id = families.id
    AND family_members.user_id = auth.uid()
    AND family_members.invitation_status = 'accepted'
  )
);