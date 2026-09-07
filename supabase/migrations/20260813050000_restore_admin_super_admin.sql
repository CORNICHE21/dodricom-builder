-- ============================================================
-- Restore admin@dodricom.com as Super Admin
-- ============================================================

DO $$
DECLARE
  target_user_id UUID;
BEGIN

  -- Find the user by email
  SELECT id
  INTO target_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER('admin@dodricom.com')
  LIMIT 1;

  -- Stop if the account does not exist
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User admin@dodricom.com not found in auth.users';
  END IF;

  -- Remove the current role(s)
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id;

  -- Restore Super Admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    target_user_id,
    'super_admin'::public.app_role
  );

  RAISE NOTICE 'admin@dodricom.com restored as super_admin';
END
$$;
