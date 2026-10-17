-- Create enum for invitation status
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'rejected');

-- Add invitation_status column to family_members
ALTER TABLE public.family_members 
ADD COLUMN invitation_status public.invitation_status NOT NULL DEFAULT 'pending';

-- Add invited_by column to track who sent the invitation
ALTER TABLE public.family_members 
ADD COLUMN invited_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Update RLS policies for family_members to allow invited users to see and respond to their invitations

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own family members" ON public.family_members;

-- Users can view family members of families they head
CREATE POLICY "Family heads can view their family members"
ON public.family_members FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.families 
  WHERE families.id = family_members.family_id 
  AND families.head_user_id = auth.uid()
));

-- Users can view invitations sent to them
CREATE POLICY "Users can view their invitations"
ON public.family_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Update existing UPDATE policy to allow invited users to respond
DROP POLICY IF EXISTS "Users can update family members" ON public.family_members;

-- Family heads can update their family members
CREATE POLICY "Family heads can update family members"
ON public.family_members FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.families 
  WHERE families.id = family_members.family_id 
  AND families.head_user_id = auth.uid()
));

-- Invited users can update their own invitation status (accept/reject)
CREATE POLICY "Users can respond to their invitations"
ON public.family_members FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Update DELETE policy
DROP POLICY IF EXISTS "Users can delete family members" ON public.family_members;

-- Family heads can delete family members
CREATE POLICY "Family heads can delete family members"
ON public.family_members FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.families 
  WHERE families.id = family_members.family_id 
  AND families.head_user_id = auth.uid()
));

-- Invited users can delete/leave (reject) their own membership
CREATE POLICY "Users can leave a family"
ON public.family_members FOR DELETE
TO authenticated
USING (user_id = auth.uid());