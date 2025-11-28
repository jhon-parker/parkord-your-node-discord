-- Create channel categories table
CREATE TABLE public.channel_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add category_id to channels
ALTER TABLE public.channels ADD COLUMN category_id UUID REFERENCES channel_categories(id) ON DELETE SET NULL;
ALTER TABLE public.channels ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

-- Enable RLS
ALTER TABLE public.channel_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for categories
CREATE POLICY "Categories are viewable by everyone" ON public.channel_categories FOR SELECT USING (true);
CREATE POLICY "Server owners can manage categories" ON public.channel_categories FOR ALL USING (auth.uid() IN (SELECT owner_id FROM servers WHERE id = server_id));

-- Enable realtime for channel_categories
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_categories;