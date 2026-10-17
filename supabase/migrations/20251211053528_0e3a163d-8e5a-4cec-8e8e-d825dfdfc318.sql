-- 1. Allow guest donations: make user_id nullable and add guest info columns
ALTER TABLE public.fund_donations 
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN guest_name text,
  ADD COLUMN guest_email text;

-- 2. Add found_at timestamp to lost_found for auto-delete tracking
ALTER TABLE public.lost_found ADD COLUMN found_at timestamp with time zone;

-- 3. Update RLS policy to allow anonymous donations
DROP POLICY IF EXISTS "Users can create fund_donations" ON public.fund_donations;
CREATE POLICY "Anyone can create fund_donations" 
ON public.fund_donations 
FOR INSERT 
WITH CHECK (true);

-- 4. Allow admins to update lost_found entries (mark as found)
CREATE POLICY "Admin can update any lost_found" 
ON public.lost_found 
FOR UPDATE 
USING (has_admin_access(auth.uid()));

-- 5. Allow admins to delete any lost_found
CREATE POLICY "Admin can delete any lost_found" 
ON public.lost_found 
FOR DELETE 
USING (has_admin_access(auth.uid()));

-- 6. Create function to auto-delete found items after 2 days
CREATE OR REPLACE FUNCTION public.auto_delete_found_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.lost_found
  WHERE is_resolved = true 
    AND found_at IS NOT NULL 
    AND found_at < NOW() - INTERVAL '2 days';
END;
$$;

-- 7. Public function for guest donations
CREATE OR REPLACE FUNCTION public.create_guest_donation(
  _fund_request_id uuid,
  _amount numeric,
  _guest_name text DEFAULT NULL,
  _guest_email text DEFAULT NULL,
  _message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  donation_id uuid;
BEGIN
  INSERT INTO public.fund_donations (fund_request_id, amount, guest_name, guest_email, message)
  VALUES (_fund_request_id, _amount, _guest_name, _guest_email, _message)
  RETURNING id INTO donation_id;
  
  -- Update fund request current amount
  UPDATE public.fund_requests 
  SET current_amount = COALESCE(current_amount, 0) + _amount
  WHERE id = _fund_request_id;
  
  RETURN donation_id;
END;
$$;