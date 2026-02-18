
-- Update channels INSERT policy to allow admins too
DROP POLICY IF EXISTS "Authenticated users can create channels" ON public.channels;
CREATE POLICY "Admins and owners can create channels"
ON public.channels FOR INSERT
WITH CHECK (
  public.get_server_role(server_id, auth.uid()) IN ('owner', 'admin')
);

-- Update channels UPDATE policy
DROP POLICY IF EXISTS "Server owners can update channels" ON public.channels;
CREATE POLICY "Admins and owners can update channels"
ON public.channels FOR UPDATE
USING (public.get_server_role(server_id, auth.uid()) IN ('owner', 'admin'));

-- Update channels DELETE policy
DROP POLICY IF EXISTS "Server owners can delete channels" ON public.channels;
CREATE POLICY "Admins and owners can delete channels"
ON public.channels FOR DELETE
USING (public.get_server_role(server_id, auth.uid()) IN ('owner', 'admin'));

-- Update channel_categories policy to allow admins
DROP POLICY IF EXISTS "Server owners can manage categories" ON public.channel_categories;
CREATE POLICY "Admins and owners can manage categories"
ON public.channel_categories FOR ALL
USING (public.get_server_role(server_id, auth.uid()) IN ('owner', 'admin'));
