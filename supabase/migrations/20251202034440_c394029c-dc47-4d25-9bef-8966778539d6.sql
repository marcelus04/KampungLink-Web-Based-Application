-- Fix the handle_new_user function to properly cast approval_status enum
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
    CASE WHEN user_role = 'admin' THEN 'approved'::approval_status ELSE 'pending'::approval_status END
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    user_role
  );
  
  RETURN NEW;
END;
$$;