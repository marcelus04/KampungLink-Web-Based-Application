-- Add is_pinned column to messages table
ALTER TABLE public.messages ADD COLUMN is_pinned boolean DEFAULT false;

-- Create index for faster pinned message queries
CREATE INDEX idx_messages_pinned ON public.messages (is_pinned) WHERE is_pinned = true;

-- Function to ensure only one pinned message per village at a time
CREATE OR REPLACE FUNCTION public.unpin_other_messages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_pinned = true THEN
    -- Get the village of the user who owns this message
    UPDATE public.messages m
    SET is_pinned = false
    WHERE m.id != NEW.id
      AND m.is_pinned = true
      AND EXISTS (
        SELECT 1 FROM profiles p1, profiles p2
        WHERE p1.user_id = m.user_id
          AND p2.user_id = NEW.user_id
          AND COALESCE(p1.village, p1.address) = COALESCE(p2.village, p2.address)
      );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-unpin other messages when one is pinned
CREATE TRIGGER unpin_other_messages_trigger
BEFORE UPDATE OF is_pinned ON public.messages
FOR EACH ROW
WHEN (NEW.is_pinned = true)
EXECUTE FUNCTION public.unpin_other_messages();

-- Allow admin to update is_pinned field
CREATE POLICY "Admin can pin messages in their village"
ON public.messages
FOR UPDATE
USING (
  has_admin_access(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.user_id = messages.user_id
      AND p2.user_id = auth.uid()
      AND COALESCE(p1.village, p1.address) = COALESCE(p2.village, p2.address)
  )
);