-- Adicionar campos para rastreamento de usuários em cada etapa do projeto
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS created_by_user_name text,
  
  ADD COLUMN IF NOT EXISTS separation_user_id uuid,
  ADD COLUMN IF NOT EXISTS separation_user_name text,
  ADD COLUMN IF NOT EXISTS separation_time timestamp with time zone,
  
  ADD COLUMN IF NOT EXISTS verification_user_id uuid,
  ADD COLUMN IF NOT EXISTS verification_user_name text,
  ADD COLUMN IF NOT EXISTS verification_time timestamp with time zone,
  
  ADD COLUMN IF NOT EXISTS office_receipt_user_id uuid,
  ADD COLUMN IF NOT EXISTS office_receipt_user_name text,
  ADD COLUMN IF NOT EXISTS office_receipt_time timestamp with time zone,
  
  ADD COLUMN IF NOT EXISTS completed_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS completed_by_user_name text,
  ADD COLUMN IF NOT EXISTS completed_time timestamp with time zone;

-- Adicionar comentários para documentação
COMMENT ON COLUMN projects.created_by_user_id IS 'ID do usuário que criou o projeto';
COMMENT ON COLUMN projects.separation_user_id IS 'ID do usuário que separou os equipamentos';
COMMENT ON COLUMN projects.verification_user_id IS 'ID do usuário que fez o check de desmontagem';
COMMENT ON COLUMN projects.office_receipt_user_id IS 'ID do usuário que recebeu os equipamentos no escritório';
COMMENT ON COLUMN projects.completed_by_user_id IS 'ID do usuário que finalizou o projeto';