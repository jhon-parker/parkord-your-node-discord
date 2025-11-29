
-- Add description to servers
ALTER TABLE public.servers ADD COLUMN IF NOT EXISTS description text;

-- Create pinned_messages table
CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL REFERENCES public.profiles(id),
  pinned_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for pinned_messages
CREATE POLICY "Pinned messages are viewable by everyone"
ON public.pinned_messages FOR SELECT USING (true);

CREATE POLICY "Server owners can pin messages"
ON public.pinned_messages FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT servers.owner_id FROM servers
    JOIN channels ON channels.server_id = servers.id
    WHERE channels.id = pinned_messages.channel_id
  )
);

CREATE POLICY "Server owners can unpin messages"
ON public.pinned_messages FOR DELETE
USING (
  auth.uid() IN (
    SELECT servers.owner_id FROM servers
    JOIN channels ON channels.server_id = servers.id
    WHERE channels.id = pinned_messages.channel_id
  )
);

-- Enable realtime for profiles (for status sync)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
