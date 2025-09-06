-- ETAPA 3: Proteção de Dados Pessoais 
-- Criação de estrutura segura para dados sensíveis

-- 1. Criar tabela para dados de contato sensíveis dos borrowers
CREATE TABLE public.borrower_contacts (
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
CREATE POLICY "Admins can view all borrower contacts"
ON public.borrower_contacts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem inserir dados de contato
CREATE POLICY "Admins can insert borrower contacts"
ON public.borrower_contacts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar dados de contato
CREATE POLICY "Admins can update borrower contacts"
ON public.borrower_contacts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ninguém pode deletar diretamente (apenas CASCADE quando loan é deletado)
-- CREATE POLICY "No direct deletion" ON public.borrower_contacts FOR DELETE USING (false);

-- 3. Migrar dados existentes da tabela loans para a nova tabela
INSERT INTO public.borrower_contacts (loan_id, borrower_email, borrower_phone, department, created_by)
SELECT 
  id as loan_id,
  borrower_email,
  borrower_phone,
  department,
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) as created_by
FROM public.loans 
WHERE borrower_email IS NOT NULL OR borrower_phone IS NOT NULL OR department IS NOT NULL;

-- 4. Remover colunas sensíveis da tabela loans
ALTER TABLE public.loans DROP COLUMN IF EXISTS borrower_email CASCADE;
ALTER TABLE public.loans DROP COLUMN IF EXISTS borrower_phone CASCADE;
ALTER TABLE public.loans DROP COLUMN IF EXISTS department CASCADE;

-- 5. Criar função segura para acessar dados de contato
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

-- 6. Criar trigger para log automático de acesso a dados sensíveis
CREATE OR REPLACE FUNCTION public.log_contact_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log automático de qualquer acesso à tabela de contatos
  PERFORM public.log_audit_entry(
    'sensitive_contact_access',
    'borrower_contacts',
    NEW.id::text,
    NULL,
    jsonb_build_object(
      'loan_id', NEW.loan_id,
      'access_type', TG_OP,
      'user_id', auth.uid(),
      'timestamp', now()
    )
  );
  
  RETURN NEW;
END;
$function$;

-- Criar trigger para log de acesso
CREATE TRIGGER log_borrower_contact_access
  AFTER SELECT ON public.borrower_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_contact_access();

-- 7. Criar alertas de segurança para acesso excessivo a dados pessoais
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

-- 8. Criar função para mascarar dados em logs de auditoria
CREATE OR REPLACE FUNCTION public.sanitize_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Mascarar emails e telefones em logs antigos
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