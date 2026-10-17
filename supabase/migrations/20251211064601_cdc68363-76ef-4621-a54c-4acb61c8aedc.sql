-- Create businesses table
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  village TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_items table
CREATE TABLE public.business_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  image_url TEXT,
  category TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_orders table
CREATE TABLE public.business_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID,
  guest_name TEXT,
  guest_contact TEXT,
  total_amount NUMERIC NOT NULL,
  amount_paid NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_order_items table
CREATE TABLE public.business_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.business_orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.business_items(id),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_order_items ENABLE ROW LEVEL SECURITY;

-- Businesses policies
CREATE POLICY "Anyone can view active businesses"
ON public.businesses FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create businesses"
ON public.businesses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their businesses"
ON public.businesses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete their businesses"
ON public.businesses FOR DELETE USING (auth.uid() = user_id);

-- Business items policies
CREATE POLICY "Anyone can view available items"
ON public.business_items FOR SELECT USING (is_available = true);

CREATE POLICY "Business owners can manage items"
ON public.business_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND user_id = auth.uid()));

CREATE POLICY "Business owners can update items"
ON public.business_items FOR UPDATE 
USING (EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND user_id = auth.uid()));

CREATE POLICY "Business owners can delete items"
ON public.business_items FOR DELETE 
USING (EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND user_id = auth.uid()));

-- Business orders policies
CREATE POLICY "Anyone can create orders"
ON public.business_orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Business owners can view their orders"
ON public.business_orders FOR SELECT 
USING (EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND user_id = auth.uid()));

CREATE POLICY "Users can view their own orders"
ON public.business_orders FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Business owners can update order status"
ON public.business_orders FOR UPDATE 
USING (EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND user_id = auth.uid()));

-- Business order items policies
CREATE POLICY "Anyone can create order items"
ON public.business_order_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Order owners can view items"
ON public.business_order_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM business_orders WHERE id = order_id AND user_id = auth.uid()));

CREATE POLICY "Business owners can view order items"
ON public.business_order_items FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM business_orders bo 
  JOIN businesses b ON bo.business_id = b.id 
  WHERE bo.id = order_id AND b.user_id = auth.uid()
));

-- Create indexes
CREATE INDEX idx_businesses_village ON public.businesses(village);
CREATE INDEX idx_businesses_user ON public.businesses(user_id);
CREATE INDEX idx_business_items_business ON public.business_items(business_id);
CREATE INDEX idx_business_orders_business ON public.business_orders(business_id);
CREATE INDEX idx_business_orders_user ON public.business_orders(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_businesses_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_items_updated_at
BEFORE UPDATE ON public.business_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_orders_updated_at
BEFORE UPDATE ON public.business_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer function for guest orders
CREATE OR REPLACE FUNCTION public.create_business_order(
  _business_id UUID,
  _guest_name TEXT,
  _guest_contact TEXT,
  _total_amount NUMERIC,
  _amount_paid NUMERIC,
  _items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order_id UUID;
  _item JSONB;
BEGIN
  -- Create the order
  INSERT INTO public.business_orders (business_id, guest_name, guest_contact, total_amount, amount_paid, status)
  VALUES (_business_id, _guest_name, _guest_contact, _total_amount, _amount_paid, 'pending')
  RETURNING id INTO _order_id;
  
  -- Insert order items
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    INSERT INTO public.business_order_items (order_id, item_id, item_name, quantity, unit_price, subtotal)
    VALUES (
      _order_id,
      (_item->>'item_id')::UUID,
      _item->>'item_name',
      (_item->>'quantity')::INTEGER,
      (_item->>'unit_price')::NUMERIC,
      (_item->>'subtotal')::NUMERIC
    );
  END LOOP;
  
  RETURN _order_id;
END;
$$;

-- Function to get public businesses by village
CREATE OR REPLACE FUNCTION public.get_public_businesses(_village TEXT)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  image_url TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.name, b.description, b.image_url, b.user_id, b.created_at
  FROM businesses b
  WHERE b.village = _village AND b.is_active = true
  ORDER BY b.created_at DESC;
$$;

-- Function to get business items
CREATE OR REPLACE FUNCTION public.get_business_items(_business_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  price NUMERIC,
  image_url TEXT,
  category TEXT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bi.id, bi.name, bi.description, bi.price, bi.image_url, bi.category
  FROM business_items bi
  WHERE bi.business_id = _business_id AND bi.is_available = true
  ORDER BY bi.category, bi.name;
$$;