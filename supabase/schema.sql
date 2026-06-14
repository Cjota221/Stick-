CREATE TABLE IF NOT EXISTS public.sticke_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  price NUMERIC NOT NULL DEFAULT 27.00,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sticke_stickers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID REFERENCES public.sticke_packs(id) ON DELETE CASCADE,
  name TEXT,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sticke_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  pack_id UUID REFERENCES public.sticke_packs(id),
  access_code TEXT UNIQUE NOT NULL,
  mp_payment_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sticke_purchases_code ON public.sticke_purchases(access_code);
CREATE INDEX IF NOT EXISTS idx_sticke_stickers_pack ON public.sticke_stickers(pack_id);

ALTER TABLE public.sticke_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticke_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticke_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sticke_packs_read" ON public.sticke_packs
  FOR SELECT USING (is_active = true);
CREATE POLICY "sticke_stickers_read" ON public.sticke_stickers
  FOR SELECT USING (true);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sticke-assets',
  'sticke-assets',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "sticke_assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'sticke-assets');
