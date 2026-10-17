-- Update RLS policies to use has_admin_access function for admin-like access

-- Announcements: Allow JKKK to create, update, delete announcements
DROP POLICY IF EXISTS "Admins can create announcements" ON public.announcements;
CREATE POLICY "Admin access can create announcements"
ON public.announcements
FOR INSERT
WITH CHECK (has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
CREATE POLICY "Admin access can update announcements"
ON public.announcements
FOR UPDATE
USING (has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
CREATE POLICY "Admin access can delete announcements"
ON public.announcements
FOR DELETE
USING (has_admin_access(auth.uid()));

-- Reports: Allow JKKK to update reports (respond to them)
DROP POLICY IF EXISTS "Users can update own reports" ON public.reports;
CREATE POLICY "Users can update own reports or admin access"
ON public.reports
FOR UPDATE
USING ((auth.uid() = user_id) OR has_admin_access(auth.uid()));

-- Reports: Allow JKKK to view all reports  
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports or admin access"
ON public.reports
FOR SELECT
USING ((auth.uid() = user_id) OR has_admin_access(auth.uid()));