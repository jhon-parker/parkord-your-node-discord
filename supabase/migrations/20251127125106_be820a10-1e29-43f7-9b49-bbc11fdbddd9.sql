-- Add status and bio to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'offline',
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add is_private to servers
ALTER TABLE public.servers 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Create server_bans table
CREATE TABLE public.server_bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES public.profiles(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(server_id, user_id)
);

ALTER TABLE public.server_bans ENABLE ROW LEVEL SECURITY;

-- RLS for server_bans
CREATE POLICY "Server owners can manage bans"
ON public.server_bans
FOR ALL
USING (
  auth.uid() IN (
    SELECT owner_id FROM public.servers WHERE id = server_id
  )
);

CREATE POLICY "Users can view their own bans"
ON public.server_bans
FOR SELECT
USING (auth.uid() = user_id);

-- Add media_url to messages and direct_messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS media_url TEXT;

ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Create storage bucket for media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for media bucket
CREATE POLICY "Authenticated users can upload media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'media' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'media');

CREATE POLICY "Users can delete their own media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Update server visibility policy
DROP POLICY IF EXISTS "Servers are viewable by everyone" ON public.servers;
CREATE POLICY "Servers are viewable based on privacy"
ON public.servers
FOR SELECT
USING (
  is_private = false OR 
  auth.uid() = owner_id OR
  auth.uid() IN (SELECT user_id FROM public.server_members WHERE server_id = id)
);

-- Function to update user status
CREATE OR REPLACE FUNCTION public.update_user_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET last_seen = now(), status = 'online'
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$;