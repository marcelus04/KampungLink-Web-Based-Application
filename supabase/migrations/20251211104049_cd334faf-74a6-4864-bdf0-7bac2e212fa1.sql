-- Update the create_guest_donation function to prevent over-donations
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
SET search_path TO 'public'
AS $$
DECLARE
  donation_id uuid;
  current_fund_amount numeric;
  target_fund_amount numeric;
  fund_status fund_status;
  remaining_amount numeric;
  actual_donation numeric;
BEGIN
  -- Lock the fund request row to prevent race conditions
  SELECT current_amount, target_amount, status 
  INTO current_fund_amount, target_fund_amount, fund_status
  FROM public.fund_requests 
  WHERE id = _fund_request_id
  FOR UPDATE;
  
  -- Check if fund request exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fund request not found';
  END IF;
  
  -- Check if fund is still active
  IF fund_status != 'active' THEN
    RAISE EXCEPTION 'This campaign is no longer accepting donations. Fund Goal Reached, Thanks for your donation!';
  END IF;
  
  -- Calculate remaining amount
  remaining_amount := target_fund_amount - COALESCE(current_fund_amount, 0);
  
  -- If already fully funded, reject
  IF remaining_amount <= 0 THEN
    -- Auto-update status to completed if not already
    UPDATE public.fund_requests SET status = 'completed' WHERE id = _fund_request_id;
    RAISE EXCEPTION 'This campaign is no longer accepting donations. Fund Goal Reached, Thanks for your donation!';
  END IF;
  
  -- Accept only up to the remaining amount (cap the donation)
  actual_donation := LEAST(_amount, remaining_amount);
  
  -- Insert the donation with the actual amount
  INSERT INTO public.fund_donations (fund_request_id, amount, guest_name, guest_email, message)
  VALUES (_fund_request_id, actual_donation, _guest_name, _guest_email, _message)
  RETURNING id INTO donation_id;
  
  -- Update fund request current amount
  UPDATE public.fund_requests 
  SET current_amount = COALESCE(current_amount, 0) + actual_donation
  WHERE id = _fund_request_id;
  
  -- Check if fund is now fully funded and update status
  IF (COALESCE(current_fund_amount, 0) + actual_donation) >= target_fund_amount THEN
    UPDATE public.fund_requests 
    SET status = 'completed' 
    WHERE id = _fund_request_id;
  END IF;
  
  RETURN donation_id;
END;
$$;

-- Create a function for authenticated user donations with same protections
CREATE OR REPLACE FUNCTION public.create_user_donation(
  _fund_request_id uuid, 
  _user_id uuid,
  _amount numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  donation_id uuid;
  current_fund_amount numeric;
  target_fund_amount numeric;
  fund_status fund_status;
  remaining_amount numeric;
  actual_donation numeric;
BEGIN
  -- Lock the fund request row to prevent race conditions
  SELECT current_amount, target_amount, status 
  INTO current_fund_amount, target_fund_amount, fund_status
  FROM public.fund_requests 
  WHERE id = _fund_request_id
  FOR UPDATE;
  
  -- Check if fund request exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fund request not found';
  END IF;
  
  -- Check if fund is still active
  IF fund_status != 'active' THEN
    RAISE EXCEPTION 'This campaign is no longer accepting donations. Fund Goal Reached, Thanks for your donation!';
  END IF;
  
  -- Calculate remaining amount
  remaining_amount := target_fund_amount - COALESCE(current_fund_amount, 0);
  
  -- If already fully funded, reject
  IF remaining_amount <= 0 THEN
    UPDATE public.fund_requests SET status = 'completed' WHERE id = _fund_request_id;
    RAISE EXCEPTION 'This campaign is no longer accepting donations. Fund Goal Reached, Thanks for your donation!';
  END IF;
  
  -- Accept only up to the remaining amount
  actual_donation := LEAST(_amount, remaining_amount);
  
  -- Insert the donation
  INSERT INTO public.fund_donations (fund_request_id, user_id, amount)
  VALUES (_fund_request_id, _user_id, actual_donation)
  RETURNING id INTO donation_id;
  
  -- Update fund request current amount
  UPDATE public.fund_requests 
  SET current_amount = COALESCE(current_amount, 0) + actual_donation
  WHERE id = _fund_request_id;
  
  -- Check if fund is now fully funded
  IF (COALESCE(current_fund_amount, 0) + actual_donation) >= target_fund_amount THEN
    UPDATE public.fund_requests 
    SET status = 'completed' 
    WHERE id = _fund_request_id;
  END IF;
  
  RETURN donation_id;
END;
$$;

-- Function to archive a fund request (admin only)
CREATE OR REPLACE FUNCTION public.archive_fund_request(_fund_request_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user has admin access (this is called from client with auth context)
  IF NOT has_admin_access(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can archive fund requests';
  END IF;
  
  UPDATE public.fund_requests 
  SET status = 'cancelled' 
  WHERE id = _fund_request_id;
  
  RETURN true;
END;
$$;

-- Enable realtime for fund_requests table
ALTER TABLE public.fund_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fund_requests;