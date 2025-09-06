-- ETAPA 4: Controle de Acesso a Equipamentos
-- Criar views com campos mascarados para usuários não-admin

-- 1. Criar view de equipamentos com dados mascarados para não-admins
CREATE OR REPLACE VIEW public.equipment_safe_view AS
SELECT 
  e.id,
  e.name,
  e.brand,
  e.category,
  e.subcategory,
  e.custom_category,
  e.status,
  e.item_type,
  e.parent_id,
  e.serial_number,
  e.purchase_date,
  e.last_maintenance,
  e.description,
  e.image,
  -- Mascarar dados financeiros para não-admins
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN e.value
    ELSE NULL
  END as value,
  e.patrimony_number,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN e.depreciated_value
    ELSE NULL
  END as depreciated_value,
  e.receive_date,
  -- Mascarar informações comerciais para não-admins
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN e.store
    ELSE NULL
  END as store,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN e.invoice
    ELSE NULL
  END as invoice,
  e.current_loan_id,
  e.current_borrower,
  e.last_loan_date,
  e.simplified_status,
  e.created_at,
  e.updated_at
FROM public.equipments e
WHERE 
  -- Admins podem ver tudo
  has_role(auth.uid(), 'admin'::app_role) OR
  -- Usuários podem ver equipamentos de seus projetos
  user_can_access_equipment(e.id);

-- 2. Criar função para atualizar acesso de equipamentos de forma mais granular
CREATE OR REPLACE FUNCTION public.user_can_access_equipment_details(equipment_id UUID)
RETURNS TABLE(
  can_view_financial BOOLEAN,
  can_view_commercial BOOLEAN,
  can_edit BOOLEAN,
  access_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
  is_project_owner BOOLEAN;
BEGIN
  -- Obter role do usuário
  SELECT public.get_current_user_role() INTO user_role;
  
  -- Verificar se é dono de projeto que usa este equipamento
  SELECT EXISTS (
    SELECT 1 FROM public.loans l
    INNER JOIN public.projects p ON (l.project = p.name OR l.project = p.id::text)
    WHERE l.equipment_id = user_can_access_equipment_details.equipment_id
      AND p.responsible_user_id = auth.uid()
      AND l.status IN ('active', 'overdue')
  ) INTO is_project_owner;
  
  -- Determinar permissões baseadas no role e ownership
  RETURN QUERY SELECT
    user_role = 'admin' as can_view_financial,
    user_role = 'admin' as can_view_commercial,
    user_role = 'admin' as can_edit,
    CASE 
      WHEN user_role = 'admin' THEN 'admin_full_access'
      WHEN is_project_owner THEN 'project_owner_basic_access'
      ELSE 'no_access'
    END as access_reason;
END;
$function$;

-- 3. Criar sistema de alertas para tentativas de acesso não autorizado
CREATE OR REPLACE FUNCTION public.log_unauthorized_access_attempt(
  _table_name TEXT,
  _record_id TEXT,
  _attempted_action TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log da tentativa não autorizada
  PERFORM public.log_audit_entry(
    'unauthorized_access_attempt',
    _table_name,
    _record_id,
    NULL,
    jsonb_build_object(
      'attempted_action', _attempted_action,
      'user_id', auth.uid(),
      'timestamp', now(),
      'ip_address', inet_client_addr(),
      'user_agent', current_setting('request.headers', true)::json->>'user-agent'
    )
  );
  
  -- Criar alerta de segurança para tentativas repetidas
  IF (
    SELECT COUNT(*) 
    FROM public.audit_logs 
    WHERE action = 'unauthorized_access_attempt'
      AND user_id = auth.uid()
      AND created_at > now() - interval '5 minutes'
  ) >= 3 THEN
    PERFORM public.create_security_alert(
      'repeated_unauthorized_access',
      'HIGH',
      'Tentativas repetidas de acesso não autorizado',
      'Usuário ' || auth.uid() || ' fez múltiplas tentativas de acesso não autorizado em 5 minutos',
      jsonb_build_object(
        'user_id', auth.uid(),
        'attempts_count', 3,
        'timeframe', '5 minutes',
        'last_attempt', _attempted_action
      )
    );
  END IF;
END;
$function$;

-- 4. Melhorar a função user_can_access_equipment com logging
CREATE OR REPLACE FUNCTION public.user_can_access_equipment(equipment_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  has_access BOOLEAN := FALSE;
  access_reason TEXT;
BEGIN
  -- Admins podem acessar tudo
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    has_access := TRUE;
    access_reason := 'admin_access';
  ELSE
    -- Usuários podem acessar equipamentos de seus projetos
    SELECT EXISTS (
      SELECT 1 FROM public.loans l
      INNER JOIN public.projects p ON (l.project = p.name OR l.project = p.id::text)
      WHERE l.equipment_id = user_can_access_equipment.equipment_id
        AND p.responsible_user_id = auth.uid()
        AND l.status IN ('active', 'overdue')
    ) INTO has_access;
    
    access_reason := CASE WHEN has_access THEN 'project_owner' ELSE 'no_access' END;
  END IF;
  
  -- Log do acesso (apenas se negado para não sobrecarregar logs)
  IF NOT has_access THEN
    PERFORM public.log_unauthorized_access_attempt(
      'equipments',
      equipment_id::text,
      'equipment_access_check'
    );
  END IF;
  
  RETURN has_access;
END;
$function$;

-- 5. Criar função para executar scan completo de segurança
CREATE OR REPLACE FUNCTION public.run_complete_security_scan()
RETURNS TABLE(
  scan_id UUID,
  scan_timestamp TIMESTAMP WITH TIME ZONE,
  vulnerabilities_found INTEGER,
  critical_issues INTEGER,
  high_issues INTEGER,
  medium_issues INTEGER,
  low_issues INTEGER,
  scan_summary JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _scan_id UUID := gen_random_uuid();
  _vulnerabilities INTEGER := 0;
  _critical INTEGER := 0;
  _high INTEGER := 0;
  _medium INTEGER := 0;
  _low INTEGER := 0;
  _summary JSONB;
BEGIN
  -- Executar manutenção de segurança
  PERFORM public.run_security_maintenance();
  
  -- Contar alertas não resolvidos por severidade
  SELECT 
    COUNT(*) FILTER (WHERE severity = 'CRITICAL'),
    COUNT(*) FILTER (WHERE severity = 'HIGH'),
    COUNT(*) FILTER (WHERE severity = 'MEDIUM'),
    COUNT(*) FILTER (WHERE severity = 'LOW')
  INTO _critical, _high, _medium, _low
  FROM public.security_alerts
  WHERE resolved = false;
  
  _vulnerabilities := _critical + _high + _medium + _low;
  
  -- Criar resumo do scan
  _summary := jsonb_build_object(
    'scan_id', _scan_id,
    'timestamp', now(),
    'total_vulnerabilities', _vulnerabilities,
    'breakdown', jsonb_build_object(
      'critical', _critical,
      'high', _high,
      'medium', _medium,
      'low', _low
    ),
    'recommendations', CASE
      WHEN _critical > 0 THEN 'Resolva imediatamente as vulnerabilidades críticas'
      WHEN _high > 0 THEN 'Priorize a resolução das vulnerabilidades de alta severidade'
      WHEN _medium > 0 THEN 'Considere resolver as vulnerabilidades médias'
      ELSE 'Sistema em bom estado de segurança'
    END
  );
  
  -- Log do scan executado
  PERFORM public.log_audit_entry(
    'security_scan_completed',
    'system',
    _scan_id::text,
    NULL,
    _summary
  );
  
  -- Retornar resultados
  RETURN QUERY SELECT
    _scan_id,
    now(),
    _vulnerabilities,
    _critical,
    _high,
    _medium,
    _low,
    _summary;
END;
$function$;