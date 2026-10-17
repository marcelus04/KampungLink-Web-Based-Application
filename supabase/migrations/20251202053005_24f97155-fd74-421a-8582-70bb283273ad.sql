-- Add approval_status column to families table for admin approval workflow
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add approved_by column to track who approved the family
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS approved_by uuid;

-- Create an index for faster queries on approval status
CREATE INDEX IF NOT EXISTS idx_families_approval_status ON public.families(approval_status);

-- Update existing families to be approved (grandfather them in)
UPDATE public.families SET approval_status = 'approved' WHERE approval_status IS NULL;

-- Add policy for admins to update family approval status
CREATE POLICY "Admin can update family approval status"
ON public.families
FOR UPDATE
USING (has_admin_access(auth.uid()))
WITH CHECK (has_admin_access(auth.uid()));