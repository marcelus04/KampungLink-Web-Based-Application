-- Create admin_announcements table for village-specific admin announcements
CREATE TABLE public.admin_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  village TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create announcement_replies table for threaded replies
CREATE TABLE public.announcement_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.admin_announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_replies ENABLE ROW LEVEL SECURITY;

-- RLS for admin_announcements
CREATE POLICY "Anyone can view announcements from their village"
ON public.admin_announcements
FOR SELECT
USING (true);

CREATE POLICY "Only admins can create announcements"
ON public.admin_announcements
FOR INSERT
WITH CHECK (has_admin_access(auth.uid()));

CREATE POLICY "Only admins can update announcements"
ON public.admin_announcements
FOR UPDATE
USING (has_admin_access(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Only admins can delete announcements"
ON public.admin_announcements
FOR DELETE
USING (has_admin_access(auth.uid()) AND user_id = auth.uid());

-- RLS for announcement_replies
CREATE POLICY "Anyone can view replies"
ON public.announcement_replies
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create replies"
ON public.announcement_replies
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own replies"
ON public.announcement_replies
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies or admins can delete any"
ON public.announcement_replies
FOR DELETE
USING (auth.uid() = user_id OR has_admin_access(auth.uid()));

-- Add updated_at trigger for announcements
CREATE TRIGGER update_admin_announcements_updated_at
BEFORE UPDATE ON public.admin_announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_admin_announcements_village ON public.admin_announcements(village);
CREATE INDEX idx_admin_announcements_created_at ON public.admin_announcements(created_at DESC);
CREATE INDEX idx_announcement_replies_announcement_id ON public.announcement_replies(announcement_id);