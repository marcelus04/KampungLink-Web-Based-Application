-- Create guest_inquiries table for guest contact seller messages
CREATE TABLE public.guest_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  guest_name TEXT NOT NULL,
  guest_contact TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guest_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create guest inquiries (no auth required)
CREATE POLICY "Anyone can create guest inquiries"
ON public.guest_inquiries
FOR INSERT
WITH CHECK (true);

-- Sellers can view inquiries for their items
CREATE POLICY "Sellers can view their inquiries"
ON public.guest_inquiries
FOR SELECT
USING (seller_id = auth.uid());

-- Sellers can update their inquiries (mark as read)
CREATE POLICY "Sellers can update their inquiries"
ON public.guest_inquiries
FOR UPDATE
USING (seller_id = auth.uid());

-- Sellers can delete their inquiries
CREATE POLICY "Sellers can delete their inquiries"
ON public.guest_inquiries
FOR DELETE
USING (seller_id = auth.uid());

-- Create index for better query performance
CREATE INDEX idx_guest_inquiries_seller ON public.guest_inquiries(seller_id);
CREATE INDEX idx_guest_inquiries_item ON public.guest_inquiries(item_id);

-- Create a security definer function to create guest inquiry (bypasses RLS for unauthenticated users)
CREATE OR REPLACE FUNCTION public.create_guest_inquiry(
  _item_id UUID,
  _seller_id UUID,
  _guest_name TEXT,
  _guest_contact TEXT,
  _message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inquiry_id UUID;
BEGIN
  INSERT INTO public.guest_inquiries (item_id, seller_id, guest_name, guest_contact, message)
  VALUES (_item_id, _seller_id, _guest_name, _guest_contact, _message)
  RETURNING id INTO _inquiry_id;
  
  RETURN _inquiry_id;
END;
$$;