-- Create approval status enum
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Add village approval columns to profiles
ALTER TABLE public.profiles
ADD COLUMN village TEXT,
ADD COLUMN approval_status approval_status DEFAULT 'pending',
ADD COLUMN approved_by UUID REFERENCES auth.users(id);

-- Update handle_new_user to set approval_status based on role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  user_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'resident');
  
  INSERT INTO public.profiles (user_id, name, email, phone, address, village, approval_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    CASE WHEN user_role = 'admin' THEN COALESCE(NEW.raw_user_meta_data ->> 'address', '') ELSE NULL END,
    NULL,
    CASE WHEN user_role = 'admin' THEN 'approved' ELSE 'pending' END
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    user_role
  );
  
  RETURN NEW;
END;
$$;

-- Add policy for admins to update any profile's approval status
CREATE POLICY "Admins can update approval status"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));