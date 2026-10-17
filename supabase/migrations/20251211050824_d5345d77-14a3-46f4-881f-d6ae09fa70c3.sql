-- Update handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role app_role;
BEGIN
  user_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'resident');
  
  INSERT INTO public.profiles (user_id, name, email, phone, address, village, gender, date_of_birth, education_level, occupation, approval_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    CASE WHEN user_role = 'admin' THEN COALESCE(NEW.raw_user_meta_data ->> 'address', '') ELSE NULL END,
    CASE WHEN user_role != 'admin' THEN COALESCE(NEW.raw_user_meta_data ->> 'village', NULL) ELSE NULL END,
    COALESCE(NEW.raw_user_meta_data ->> 'gender', NULL),
    CASE WHEN NEW.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL THEN (NEW.raw_user_meta_data ->> 'date_of_birth')::date ELSE NULL END,
    COALESCE(NEW.raw_user_meta_data ->> 'education_level', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'occupation', NULL),
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