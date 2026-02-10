
-- Reactions table
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  table_name TEXT NOT NULL DEFAULT 'messages',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji, table_name)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions are viewable by everyone" ON public.message_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their reactions" ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);

-- Server roles
CREATE TYPE public.server_role AS ENUM ('owner', 'admin', 'moderator', 'member');

CREATE TABLE public.server_member_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role server_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(server_id, user_id)
);

ALTER TABLE public.server_member_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roles viewable by server members" ON public.server_member_roles FOR SELECT USING (true);
CREATE POLICY "Server owners can manage roles" ON public.server_member_roles FOR ALL USING (
  auth.uid() IN (SELECT owner_id FROM servers WHERE id = server_member_roles.server_id)
);
CREATE POLICY "Admins can manage non-owner roles" ON public.server_member_roles FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM server_member_roles smr 
    WHERE smr.server_id = server_member_roles.server_id 
    AND smr.user_id = auth.uid() 
    AND smr.role = 'admin'
  )
);

-- Muted members
CREATE TABLE public.server_mutes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(server_id, user_id)
);

ALTER TABLE public.server_mutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mutes viewable by server members" ON public.server_mutes FOR SELECT USING (true);
CREATE POLICY "Admins and owners can manage mutes" ON public.server_mutes FOR ALL USING (
  auth.uid() IN (SELECT owner_id FROM servers WHERE id = server_mutes.server_id)
  OR EXISTS (
    SELECT 1 FROM server_member_roles smr
    WHERE smr.server_id = server_mutes.server_id
    AND smr.user_id = auth.uid()
    AND smr.role IN ('admin', 'moderator')
  )
);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.server_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.servers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- Function to check server role
CREATE OR REPLACE FUNCTION public.get_server_role(p_server_id UUID, p_user_id UUID)
RETURNS server_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM servers WHERE id = p_server_id AND owner_id = p_user_id) THEN 'owner'::server_role
    ELSE COALESCE(
      (SELECT role FROM server_member_roles WHERE server_id = p_server_id AND user_id = p_user_id),
      'member'::server_role
    )
  END;
$$;
