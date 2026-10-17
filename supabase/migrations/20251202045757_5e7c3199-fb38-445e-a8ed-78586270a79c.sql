-- Fix profiles table RLS: Remove public exposure
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin/JKKK can view all profiles for management
CREATE POLICY "Admin can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_admin_access(auth.uid()));

-- Fix fund_donations table RLS: Remove public exposure
DROP POLICY IF EXISTS "Anyone can view fund_donations" ON public.fund_donations;

-- Users can view their own donations
CREATE POLICY "Users can view own donations"
ON public.fund_donations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Fund request creators can view donations to their campaigns
CREATE POLICY "Fund creators can view their donations"
ON public.fund_donations FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM fund_requests 
  WHERE fund_requests.id = fund_donations.fund_request_id 
  AND fund_requests.user_id = auth.uid()
));

-- Admin/JKKK can view all donations for oversight
CREATE POLICY "Admin can view all donations"
ON public.fund_donations FOR SELECT
TO authenticated
USING (has_admin_access(auth.uid()));