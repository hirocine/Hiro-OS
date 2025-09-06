-- Atualizar trigger para capturar avatar_url do Google
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, position, department, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name', 
      NEW.raw_user_meta_data ->> 'name'
    ),
    NEW.raw_user_meta_data ->> 'position',
    NEW.raw_user_meta_data ->> 'department',
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture'
    )
  );
  RETURN NEW;
END;
$$;

-- Atualizar perfis existentes que não têm avatar mas têm dados do Google
UPDATE public.profiles 
SET avatar_url = COALESCE(
  (SELECT au.raw_user_meta_data ->> 'avatar_url' FROM auth.users au WHERE au.id = profiles.user_id),
  (SELECT au.raw_user_meta_data ->> 'picture' FROM auth.users au WHERE au.id = profiles.user_id)
)
WHERE avatar_url IS NULL 
  AND EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = profiles.user_id 
      AND (
        au.raw_user_meta_data ->> 'avatar_url' IS NOT NULL OR 
        au.raw_user_meta_data ->> 'picture' IS NOT NULL
      )
  );