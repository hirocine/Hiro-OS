-- Verificar se existe algum problema na constraint UNIQUE da tabela profiles
-- e corrigir se necessário
DO $$
DECLARE
    profile_count INTEGER;
BEGIN
    -- Verificar se há perfis duplicados
    SELECT COUNT(*) INTO profile_count 
    FROM profiles 
    WHERE user_id = '73326d23-3e79-432f-a3f2-11b50e87a211';
    
    -- Se há mais de um perfil, manter apenas o mais recente
    IF profile_count > 1 THEN
        DELETE FROM profiles 
        WHERE user_id = '73326d23-3e79-432f-a3f2-11b50e87a211'
        AND id NOT IN (
            SELECT id 
            FROM profiles 
            WHERE user_id = '73326d23-3e79-432f-a3f2-11b50e87a211'
            ORDER BY created_at DESC 
            LIMIT 1
        );
    END IF;
END $$;

-- Garantir que a constraint unique existe
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_unique;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);