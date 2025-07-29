-- Primeiro, limpar roles duplicadas, mantendo apenas uma por usuário
-- Priorizando 'admin' sobre 'user' se existirem ambos
DELETE FROM public.user_roles 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM public.user_roles 
  ORDER BY user_id, 
    CASE 
      WHEN role = 'admin' THEN 1 
      WHEN role = 'user' THEN 2 
      ELSE 3 
    END
);

-- Adicionar constraint para evitar roles duplicadas no futuro
ALTER TABLE public.user_roles 
ADD CONSTRAINT unique_user_role UNIQUE (user_id);