ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'marketing';

COMMENT ON TYPE public.app_role IS 'Roles do sistema: user (operações), marketing (operações + marketing), producao (operações + produção + marketing), admin (tudo)';