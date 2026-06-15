DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id
    INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower('carolineazeved075@gmail.com')
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for email %', 'carolineazeved075@gmail.com';
  END IF;

  INSERT INTO public.sticke_profiles (id, name, phone, lifetime_access, updated_at)
  VALUES (v_user_id, 'Caroline Azevedo', '', true, now())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    lifetime_access = true,
    updated_at = now();
END $$;

SELECT id, name, phone, lifetime_access, updated_at
FROM public.sticke_profiles
WHERE id = (
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower('carolineazeved075@gmail.com')
  LIMIT 1
);
