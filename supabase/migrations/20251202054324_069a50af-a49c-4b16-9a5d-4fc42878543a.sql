-- Drop the problematic policy
DROP POLICY IF EXISTS "Family members can view their family" ON public.families;

-- Create a security definer function to check if user is a family member
CREATE OR REPLACE FUNCTION public.is_family_member(_user_id uuid, _family_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE user_id = _user_id
      AND family_id = _family_id
      AND invitation_status = 'accepted'
  )
$$;

-- Create a function to get family ids where user is an accepted member
CREATE OR REPLACE FUNCTION public.get_user_family_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id
  FROM public.family_members
  WHERE user_id = _user_id
    AND invitation_status = 'accepted'
$$;

-- Allow family members to view families they belong to (using security definer function)
CREATE POLICY "Family members can view their family"
ON public.families
FOR SELECT
USING (
  id IN (SELECT public.get_user_family_ids(auth.uid()))
);