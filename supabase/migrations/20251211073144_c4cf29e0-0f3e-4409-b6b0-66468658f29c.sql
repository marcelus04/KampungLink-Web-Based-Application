-- Create enum for facility types
CREATE TYPE public.facility_type AS ENUM ('library', 'pusat_it', 'hall');

-- Create enum for booking status
CREATE TYPE public.booking_status AS ENUM ('booked', 'cancelled');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('paid', 'unpaid');

-- Create facilities table (default facilities per village)
CREATE TABLE public.facilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  village TEXT NOT NULL,
  facility_type facility_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(village, facility_type)
);

-- Create facility resources table (rooms, PCs, hall sections)
CREATE TABLE public.facility_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'study_room', 'conference_room', 'pc_station', 'hall'
  capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create facility bookings table
CREATE TABLE public.facility_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.facility_resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  village TEXT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  purpose TEXT NOT NULL,
  num_people INTEGER,
  -- Hall specific addons
  catering BOOLEAN DEFAULT false,
  pa_system BOOLEAN DEFAULT false,
  event_type TEXT,
  -- Status fields
  booking_status booking_status NOT NULL DEFAULT 'booked',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for availability checking
CREATE INDEX idx_facility_bookings_availability ON public.facility_bookings(resource_id, booking_date, booking_status);
CREATE INDEX idx_facility_bookings_user ON public.facility_bookings(user_id);
CREATE INDEX idx_facility_bookings_village ON public.facility_bookings(village);

-- Enable RLS
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_bookings ENABLE ROW LEVEL SECURITY;

-- Facilities policies (everyone can view active facilities)
CREATE POLICY "Anyone can view active facilities"
ON public.facilities FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin can manage facilities"
ON public.facilities FOR ALL
USING (has_admin_access(auth.uid()));

-- Resources policies
CREATE POLICY "Anyone can view active resources"
ON public.facility_resources FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin can manage resources"
ON public.facility_resources FOR ALL
USING (has_admin_access(auth.uid()));

-- Bookings policies
CREATE POLICY "Users can view own bookings"
ON public.facility_bookings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all village bookings"
ON public.facility_bookings FOR SELECT
USING (has_admin_access(auth.uid()));

CREATE POLICY "Users can create bookings"
ON public.facility_bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
ON public.facility_bookings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admin can update bookings"
ON public.facility_bookings FOR UPDATE
USING (has_admin_access(auth.uid()));

-- Function to check booking availability
CREATE OR REPLACE FUNCTION public.check_booking_availability(
  _resource_id UUID,
  _booking_date DATE,
  _start_time TIME,
  _end_time TIME,
  _exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.facility_bookings
    WHERE resource_id = _resource_id
      AND booking_date = _booking_date
      AND booking_status = 'booked'
      AND (id != _exclude_booking_id OR _exclude_booking_id IS NULL)
      AND (
        (start_time < _end_time AND end_time > _start_time)
      )
  )
$$;

-- Function to get available slots for a resource on a date
CREATE OR REPLACE FUNCTION public.get_booked_slots(
  _resource_id UUID,
  _booking_date DATE
)
RETURNS TABLE(start_time TIME, end_time TIME)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT start_time, end_time
  FROM public.facility_bookings
  WHERE resource_id = _resource_id
    AND booking_date = _booking_date
    AND booking_status = 'booked'
  ORDER BY start_time
$$;

-- Function to initialize default facilities for a village
CREATE OR REPLACE FUNCTION public.initialize_village_facilities(_village TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  library_id UUID;
  pusat_it_id UUID;
  hall_id UUID;
BEGIN
  -- Create Library if not exists
  INSERT INTO public.facilities (village, facility_type, name, description)
  VALUES (_village, 'library', 'Perpustakaan ' || _village, 'Village library with study rooms and conference room')
  ON CONFLICT (village, facility_type) DO NOTHING
  RETURNING id INTO library_id;
  
  IF library_id IS NOT NULL THEN
    -- Add library resources
    INSERT INTO public.facility_resources (facility_id, name, resource_type, capacity) VALUES
      (library_id, 'Bilik Belajar 1', 'study_room', 6),
      (library_id, 'Bilik Belajar 2', 'study_room', 6),
      (library_id, 'Bilik Belajar 3', 'study_room', 4),
      (library_id, 'Bilik Mesyuarat', 'conference_room', 20);
  END IF;
  
  -- Create Pusat IT if not exists
  INSERT INTO public.facilities (village, facility_type, name, description)
  VALUES (_village, 'pusat_it', 'Pusat IT ' || _village, 'IT center with computer stations')
  ON CONFLICT (village, facility_type) DO NOTHING
  RETURNING id INTO pusat_it_id;
  
  IF pusat_it_id IS NOT NULL THEN
    -- Add PC stations
    INSERT INTO public.facility_resources (facility_id, name, resource_type, capacity) VALUES
      (pusat_it_id, 'PC 1', 'pc_station', 1),
      (pusat_it_id, 'PC 2', 'pc_station', 1),
      (pusat_it_id, 'PC 3', 'pc_station', 1),
      (pusat_it_id, 'PC 4', 'pc_station', 1),
      (pusat_it_id, 'PC 5', 'pc_station', 1),
      (pusat_it_id, 'PC 6', 'pc_station', 1),
      (pusat_it_id, 'PC 7', 'pc_station', 1),
      (pusat_it_id, 'PC 8', 'pc_station', 1);
  END IF;
  
  -- Create Hall if not exists
  INSERT INTO public.facilities (village, facility_type, name, description)
  VALUES (_village, 'hall', 'Dewan ' || _village, 'Community hall for events and gatherings')
  ON CONFLICT (village, facility_type) DO NOTHING
  RETURNING id INTO hall_id;
  
  IF hall_id IS NOT NULL THEN
    -- Add hall as single resource
    INSERT INTO public.facility_resources (facility_id, name, resource_type, capacity) VALUES
      (hall_id, 'Dewan Utama', 'hall', 200);
  END IF;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_facilities_updated_at
BEFORE UPDATE ON public.facilities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facility_resources_updated_at
BEFORE UPDATE ON public.facility_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facility_bookings_updated_at
BEFORE UPDATE ON public.facility_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();