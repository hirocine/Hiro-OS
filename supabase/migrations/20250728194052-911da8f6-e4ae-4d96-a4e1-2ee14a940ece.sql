-- Make the first user (if any) an admin
DO $$
BEGIN
  -- Check if there are any users and make the first one admin
  IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'admin'::app_role
    FROM auth.users
    ORDER BY created_at ASC
    LIMIT 1
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;