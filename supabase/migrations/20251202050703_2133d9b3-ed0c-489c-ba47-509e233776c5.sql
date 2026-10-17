-- Create enum for family member roles
CREATE TYPE public.family_role AS ENUM ('father', 'mother', 'son', 'daughter', 'other');

-- Create families table (households)
CREATE TABLE public.families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  head_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  village TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create family_members table
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  ic_number TEXT,
  role public.family_role NOT NULL DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Families RLS policies
CREATE POLICY "Users can view own family"
ON public.families FOR SELECT
TO authenticated
USING (head_user_id = auth.uid());

CREATE POLICY "Users can create own family"
ON public.families FOR INSERT
TO authenticated
WITH CHECK (head_user_id = auth.uid());

CREATE POLICY "Users can update own family"
ON public.families FOR UPDATE
TO authenticated
USING (head_user_id = auth.uid());

CREATE POLICY "Users can delete own family"
ON public.families FOR DELETE
TO authenticated
USING (head_user_id = auth.uid());

CREATE POLICY "Admin can view all families"
ON public.families FOR SELECT
TO authenticated
USING (has_admin_access(auth.uid()));

-- Family members RLS policies
CREATE POLICY "Users can view own family members"
ON public.family_members FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.families 
  WHERE families.id = family_members.family_id 
  AND families.head_user_id = auth.uid()
));

CREATE POLICY "Users can create family members"
ON public.family_members FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.families 
  WHERE families.id = family_members.family_id 
  AND families.head_user_id = auth.uid()
));

CREATE POLICY "Users can update family members"
ON public.family_members FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.families 
  WHERE families.id = family_members.family_id 
  AND families.head_user_id = auth.uid()
));

CREATE POLICY "Users can delete family members"
ON public.family_members FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.families 
  WHERE families.id = family_members.family_id 
  AND families.head_user_id = auth.uid()
));

CREATE POLICY "Admin can view all family members"
ON public.family_members FOR SELECT
TO authenticated
USING (has_admin_access(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_families_updated_at
BEFORE UPDATE ON public.families
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at
BEFORE UPDATE ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();