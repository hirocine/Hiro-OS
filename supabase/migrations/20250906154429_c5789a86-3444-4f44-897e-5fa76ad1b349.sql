-- ETAPA 3: Proteção de Dados Pessoais (CORREÇÃO)
-- Criação de estrutura segura para dados sensíveis

-- 1. Criar tabela para dados de contato sensíveis dos borrowers
CREATE TABLE IF NOT EXISTS public.borrower_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  borrower_email TEXT,
  borrower_phone TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.borrower_contacts ENABLE ROW LEVEL SECURITY;

-- 2. Criar políticas RLS ultra-restritivas para dados sensíveis
-- Apenas admins podem ver todos os dados de contato
DROP POLICY IF EXISTS "Admins can view all borrower contacts" ON public.borrower_contacts;
CREATE POLICY "Admins can view all borrower contacts"
ON public.borrower_contacts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem inserir dados de contato
DROP POLICY IF EXISTS "Admins can insert borrower contacts" ON public.borrower_contacts;
CREATE POLICY "Admins can insert borrower contacts"
ON public.borrower_contacts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar dados de contato
DROP POLICY IF EXISTS "Admins can update borrower contacts" ON public.borrower_contacts;
CREATE POLICY "Admins can update borrower contacts"
ON public.borrower_contacts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Migrar dados existentes da tabela loans para a nova tabela (se ainda existirem as colunas)
DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Verificar se a coluna borrower_email ainda existe
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'loans' 
        AND column_name = 'borrower_email'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    -- Se existe, migrar os dados
    IF column_exists THEN
        INSERT INTO public.borrower_contacts (loan_id, borrower_email, borrower_phone, department, created_by)
        SELECT 
          id as loan_id,
          borrower_email,
          borrower_phone,
          department,
          (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) as created_by
        FROM public.loans 
        WHERE borrower_email IS NOT NULL OR borrower_phone IS NOT NULL OR department IS NOT NULL
        ON CONFLICT DO NOTHING;
        
        -- Remover as colunas após migração
        ALTER TABLE public.loans DROP COLUMN IF EXISTS borrower_email CASCADE;
        ALTER TABLE public.loans DROP COLUMN IF EXISTS borrower_phone CASCADE;
        ALTER TABLE public.loans DROP COLUMN IF EXISTS department CASCADE;
    END IF;
END $$;

-- 4. Criar função segura para acessar dados de contato
CREATE OR REPLACE FUNCTION public.get_loan_contact_info(loan_id UUID)
RETURNS TABLE(borrower_email TEXT, borrower_phone TEXT, department TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se usuário tem permissão para acessar este empréstimo
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR 
          EXISTS (
            SELECT 1 FROM public.loans l
            INNER JOIN public.projects p ON (l.project = p.name OR l.project = p.id::text)
            WHERE l.id = loan_id 
              AND p.responsible_user_id = auth.uid()
          )) THEN
    RAISE EXCEPTION 'Acesso negado aos dados de contato';
  END IF;

  -- Log do acesso para auditoria
  PERFORM public.log_audit_entry(
    'contact_data_access',
    'borrower_contacts',
    loan_id::text,
    NULL,
    jsonb_build_object(
      'accessed_by', auth.uid(),
      'access_reason', CASE 
        WHEN has_role(auth.uid(), 'admin'::app_role) THEN 'admin_access'
        ELSE 'project_owner_access'
      END
    )
  );

  -- Retornar dados apenas se autorizado
  RETURN QUERY
  SELECT bc.borrower_email, bc.borrower_phone, bc.department
  FROM public.borrower_contacts bc
  WHERE bc.loan_id = get_loan_contact_info.loan_id;
END;
$function$;

-- 5. Criar função para monitorar acesso excessivo a dados pessoais
CREATE OR REPLACE FUNCTION public.monitor_contact_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  suspicious_access RECORD;
BEGIN
  -- Detectar usuários não-admin acessando muitos dados de contato
  FOR suspicious_access IN (
    SELECT 
      user_id,
      COUNT(*) as access_count
    FROM public.audit_logs
    WHERE action = 'contact_data_access'
      AND created_at > now() - interval '1 hour'
      AND user_id IS NOT NULL
      AND NOT has_role(user_id, 'admin'::app_role)
    GROUP BY user_id
    HAVING COUNT(*) > 10
  ) LOOP
    PERFORM public.create_security_alert(
      'excessive_contact_access',
      'HIGH',
      'Acesso excessivo a dados pessoais',
      'Usuário ' || suspicious_access.user_id || ' acessou ' || suspicious_access.access_count || ' registros de contato na última hora',
      jsonb_build_object(
        'user_id', suspicious_access.user_id,
        'access_count', suspicious_access.access_count,
        'timeframe', '1 hour'
      )
    );
  END LOOP;
END;
$function$;

-- 6. Criar função para sanitizar logs de auditoria
CREATE OR REPLACE FUNCTION public.sanitize_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Mascarar emails e telefones em logs antigos (mais de 30 dias)
  UPDATE public.audit_logs
  SET 
    old_values = CASE 
      WHEN old_values ? 'borrower_email' THEN
        old_values || jsonb_build_object(
          'borrower_email', 
          CASE 
            WHEN (old_values->>'borrower_email') IS NOT NULL THEN
              LEFT((old_values->>'borrower_email'), 3) || '***@***.***'
            ELSE NULL
          END
        )
      ELSE old_values
    END,
    new_values = CASE 
      WHEN new_values ? 'borrower_email' THEN
        new_values || jsonb_build_object(
          'borrower_email', 
          CASE 
            WHEN (new_values->>'borrower_email') IS NOT NULL THEN
              LEFT((new_values->>'borrower_email'), 3) || '***@***.***'
            ELSE NULL
          END
        )
      ELSE new_values
    END
  WHERE created_at < now() - interval '30 days'
    AND (old_values ? 'borrower_email' OR new_values ? 'borrower_email')
    AND action != 'sanitize_logs'; -- Evitar recursão
    
  -- Log da operação de sanitização
  PERFORM public.log_audit_entry(
    'sanitize_logs',
    'audit_logs',
    NULL,
    NULL,
    jsonb_build_object(
      'sanitized_at', now(),
      'reason', 'data_protection_compliance'
    )
  );
END;
$function$;

-- 7. Criar função para execução automática de limpeza de logs
CREATE OR REPLACE FUNCTION public.run_security_maintenance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Executar sanitização de logs
  PERFORM public.sanitize_audit_logs();
  
  -- Executar monitoramento de acesso
  PERFORM public.monitor_contact_access();
  
  -- Detectar atividades suspeitas
  PERFORM public.detect_suspicious_activity();
  
  -- Log da manutenção executada
  PERFORM public.log_audit_entry(
    'security_maintenance',
    'system',
    NULL,
    NULL,
    jsonb_build_object(
      'maintenance_at', now(),
      'operations', array['sanitize_logs', 'monitor_access', 'detect_suspicious']
    )
  );
END;
$function$;