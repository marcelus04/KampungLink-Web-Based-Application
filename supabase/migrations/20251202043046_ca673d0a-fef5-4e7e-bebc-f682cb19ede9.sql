-- Add UPDATE policy for messages so users can edit their own messages
CREATE POLICY "Users can update own messages" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = user_id);