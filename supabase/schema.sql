CREATE TABLE IF NOT EXISTS public.sticke_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sticke_stickers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES public.sticke_packs(id) ON DELETE CASCADE,
  name TEXT,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sticke_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  lifetime_access BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sticke_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  pack_id UUID REFERENCES public.sticke_packs(id),
  access_code TEXT UNIQUE,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 37.90,
  payment_method TEXT,
  mp_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sticke_purchases ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.sticke_purchases ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2) NOT NULL DEFAULT 37.90;
ALTER TABLE public.sticke_purchases ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.sticke_purchases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.sticke_purchases ALTER COLUMN access_code DROP NOT NULL;
ALTER TABLE public.sticke_purchases DROP CONSTRAINT IF EXISTS sticke_purchases_status_check;
ALTER TABLE public.sticke_purchases ADD CONSTRAINT sticke_purchases_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));

COMMENT ON COLUMN public.sticke_packs.price IS
  'Campo legado. A venda e de acesso completo a plataforma, nao por categoria.';
COMMENT ON COLUMN public.sticke_purchases.pack_id IS
  'Campo legado para compras antigas. Compras novas de acesso completo usam NULL.';
COMMENT ON COLUMN public.sticke_profiles.lifetime_access IS
  'Autorizacao concedida exclusivamente pelo servidor apos pagamento aprovado.';

CREATE INDEX IF NOT EXISTS idx_sticke_stickers_pack ON public.sticke_stickers(pack_id);
CREATE INDEX IF NOT EXISTS idx_sticke_purchases_code ON public.sticke_purchases(access_code);
CREATE INDEX IF NOT EXISTS idx_sticke_purchases_user ON public.sticke_purchases(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sticke_purchases_mp_payment
  ON public.sticke_purchases(mp_payment_id)
  WHERE mp_payment_id IS NOT NULL;

ALTER TABLE public.sticke_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticke_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticke_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticke_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sticke_packs_read" ON public.sticke_packs;
DROP POLICY IF EXISTS "sticke_stickers_read" ON public.sticke_stickers;
DROP POLICY IF EXISTS "sticke_profiles_read_own" ON public.sticke_profiles;
DROP POLICY IF EXISTS "sticke_purchases_read_own" ON public.sticke_purchases;

CREATE POLICY "sticke_profiles_read_own" ON public.sticke_profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "sticke_purchases_read_own" ON public.sticke_purchases
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

GRANT SELECT ON public.sticke_profiles TO authenticated;
GRANT SELECT ON public.sticke_purchases TO authenticated;
REVOKE ALL ON public.sticke_packs FROM anon, authenticated;
REVOKE ALL ON public.sticke_stickers FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.sticke_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.sticke_profiles (id, name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sticke_handle_new_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_sticke_auth_user_created ON auth.users;
CREATE TRIGGER on_sticke_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sticke_handle_new_user();

INSERT INTO public.sticke_profiles (id, name, phone)
SELECT
  id,
  COALESCE(raw_user_meta_data ->> 'name', ''),
  COALESCE(raw_user_meta_data ->> 'phone', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sticke-assets',
  'sticke-assets',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "sticke_assets_public_read" ON storage.objects;
