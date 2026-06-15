-- Libera acesso vitalício direto para esta conta.
-- Execute no SQL Editor do Supabase. Isso não passa por checkout.

UPDATE public.sticke_profiles
SET
  name = 'Caroline Azevedo',
  phone = '',
  lifetime_access = true,
  updated_at = now()
WHERE id = (
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower('carolineazeved075@gmail.com')
  LIMIT 1
);

INSERT INTO public.sticke_profiles (id, name, phone, lifetime_access, updated_at)
SELECT
  id,
  'Caroline Azevedo',
  '',
  true,
  now()
FROM auth.users
WHERE lower(email) = lower('carolineazeved075@gmail.com')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  lifetime_access = true,
  updated_at = now();

SELECT id, name, phone, lifetime_access, updated_at
FROM public.sticke_profiles
WHERE id = (
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower('carolineazeved075@gmail.com')
  LIMIT 1
);
