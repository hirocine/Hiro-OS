-- Continuação da ETAPA 1: Correção do Search Path nas funções finais

-- 21. cleanup_project_loans
CREATE OR REPLACE FUNCTION public.cleanup_project_loans()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  project_name_val TEXT;
  project_id_val UUID;
BEGIN
  -- For AFTER DELETE, use OLD to get the deleted project data
  project_name_val := OLD.name;
  project_id_val := OLD.id;
  
  -- Set a session variable to indicate we're in cleanup mode
  PERFORM set_config('app.in_project_cleanup', 'true', true);
  
  -- Return all equipment from the deleted project
  -- Use both project name and ID for matching
  UPDATE loans 
  SET status = 'returned',
      actual_return_date = CURRENT_DATE,
      return_notes = 'Equipamento retornado automaticamente - projeto deletado',
      return_condition = 'good'
  WHERE (project = project_name_val OR project = project_id_val::text)
    AND status IN ('active', 'overdue');
  
  -- Reset the session variable
  PERFORM set_config('app.in_project_cleanup', 'false', true);
  
  RETURN OLD;
END;
$function$;

-- 22. log_sensitive_data_access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log acessos a dados sensíveis de loans por usuários não-admin
  IF TG_TABLE_NAME = 'loans' AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    PERFORM public.log_audit_entry(
      'sensitive_data_access',
      TG_TABLE_NAME,
      NEW.id::text,
      NULL,
      jsonb_build_object(
        'accessed_fields', array['borrower_name', 'borrower_email', 'borrower_phone'],
        'project', NEW.project,
        'access_reason', 'project_ownership'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 23. audit_data_access
CREATE OR REPLACE FUNCTION public.audit_data_access()
 RETURNS TABLE(table_name text, policy_name text, potential_exposure text, severity text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    'loans'::TEXT,
    'Data exposure check'::TEXT,
    'Personal data in loans table accessible by project owners'::TEXT,
    'MEDIUM'::TEXT
  WHERE EXISTS (
    SELECT 1 FROM public.loans l
    INNER JOIN public.projects p ON (l.project = p.name OR l.project = p.id::text)
    WHERE p.responsible_user_id IS NOT NULL
  );
  
  RETURN QUERY
  SELECT 
    'projects'::TEXT,
    'Data exposure check'::TEXT,
    'Project data restricted to owners and admins'::TEXT,
    'LOW'::TEXT;
  
  RETURN QUERY
  SELECT 
    'equipments'::TEXT,
    'Data exposure check'::TEXT,
    'Equipment data now restricted based on project access'::TEXT,
    'LOW'::TEXT;
END;
$function$;

-- 24. validate_project_exists
CREATE OR REPLACE FUNCTION public.validate_project_exists()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip validation if we're in project cleanup mode
  IF current_setting('app.in_project_cleanup', true) = 'true' THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se o projeto existe
  IF NOT EXISTS (
    SELECT 1 FROM projects 
    WHERE name = NEW.project OR id::text = NEW.project
  ) THEN
    RAISE EXCEPTION 'Projeto "%" não encontrado', NEW.project;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 25. check_password_security_settings
CREATE OR REPLACE FUNCTION public.check_password_security_settings()
 RETURNS TABLE(setting_name text, current_status text, recommendation text, priority text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    'Leaked Password Protection'::TEXT,
    'Manual check required'::TEXT,
    'Enable in Supabase Dashboard > Authentication > Settings'::TEXT,
    'HIGH'::TEXT;
  
  RETURN QUERY
  SELECT 
    'Password Strength'::TEXT,
    'Manual check required'::TEXT,
    'Set minimum length and complexity in Dashboard'::TEXT,
    'MEDIUM'::TEXT;
  
  RETURN QUERY
  SELECT 
    'Rate Limiting'::TEXT,
    'Manual check required'::TEXT,
    'Configure in Supabase Dashboard > Authentication > Rate Limits'::TEXT,
    'HIGH'::TEXT;
END;
$function$;

-- 26. check_login_rate_limit
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(_ip_address inet, _user_email text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ip_attempts INTEGER;
  email_attempts INTEGER;
  result JSONB;
BEGIN
  -- Contar tentativas falhadas por IP nas últimas 15 minutos
  SELECT COUNT(*) INTO ip_attempts
  FROM public.login_attempts
  WHERE ip_address = _ip_address
    AND success = false
    AND attempt_time > now() - interval '15 minutes';
  
  -- Contar tentativas falhadas por email nas últimas 1 hora (se email fornecido)
  IF _user_email IS NOT NULL THEN
    SELECT COUNT(*) INTO email_attempts
    FROM public.login_attempts
    WHERE user_email = _user_email
      AND success = false
      AND attempt_time > now() - interval '1 hour';
  ELSE
    email_attempts := 0;
  END IF;
  
  -- Construir resultado
  result := jsonb_build_object(
    'allowed', (ip_attempts < 10 AND email_attempts < 5),
    'ip_attempts', ip_attempts,
    'email_attempts', email_attempts,
    'ip_limit', 10,
    'email_limit', 5,
    'retry_after_minutes', CASE 
      WHEN ip_attempts >= 10 THEN 15
      WHEN email_attempts >= 5 THEN 60
      ELSE 0
    END
  );
  
  RETURN result;
END;
$function$;

-- 27. log_login_attempt
CREATE OR REPLACE FUNCTION public.log_login_attempt(_ip_address inet, _user_email text, _success boolean, _failure_reason text DEFAULT NULL::text, _user_agent text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.login_attempts (
    ip_address,
    user_email,
    success,
    failure_reason,
    user_agent
  ) VALUES (
    _ip_address,
    _user_email,
    _success,
    _failure_reason,
    _user_agent
  );
  
  -- Limpar tentativas antigas (mais de 24 horas)
  DELETE FROM public.login_attempts
  WHERE attempt_time < now() - interval '24 hours';
END;
$function$;

-- 28. create_security_alert
CREATE OR REPLACE FUNCTION public.create_security_alert(_alert_type text, _severity text, _title text, _description text DEFAULT NULL::text, _metadata jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  alert_id UUID;
BEGIN
  INSERT INTO public.security_alerts (
    alert_type,
    severity,
    title,
    description,
    metadata
  ) VALUES (
    _alert_type,
    _severity,
    _title,
    _description,
    _metadata
  ) RETURNING id INTO alert_id;
  
  -- Se for crítico, criar notificação para admins
  IF _severity = 'CRITICAL' THEN
    PERFORM public.create_notification_for_all_users(
      'ALERTA DE SEGURANÇA CRÍTICO: ' || _title,
      _description,
      'system',
      'security_alerts',
      alert_id
    );
  END IF;
  
  RETURN alert_id;
END;
$function$;

-- 29. detect_suspicious_activity
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  suspicious_ips INTEGER;
  failed_logins INTEGER;
  rec RECORD;
BEGIN
  -- Detectar IPs com muitas tentativas falhadas
  FOR rec IN (
    SELECT ip_address, COUNT(*) as attempts
    FROM public.login_attempts
    WHERE success = false
      AND attempt_time > now() - interval '1 hour'
    GROUP BY ip_address
    HAVING COUNT(*) >= 20
  ) LOOP
    PERFORM public.create_security_alert(
      'suspicious_login_attempts',
      'HIGH',
      'IP com tentativas excessivas de login',
      'IP ' || rec.ip_address::text || ' fez ' || rec.attempts || ' tentativas falhadas na última hora',
      jsonb_build_object(
        'ip_address', rec.ip_address,
        'attempts', rec.attempts,
        'timeframe', '1 hour'
      )
    );
  END LOOP;
  
  -- Detectar padrões de acesso anômalos nos logs de auditoria
  SELECT COUNT(*) INTO suspicious_ips
  FROM (
    SELECT ip_address
    FROM public.audit_logs
    WHERE created_at > now() - interval '1 hour'
      AND action IN ('login', 'sensitive_data_access')
    GROUP BY ip_address
    HAVING COUNT(DISTINCT user_id) > 5
  ) t;
  
  IF suspicious_ips > 0 THEN
    PERFORM public.create_security_alert(
      'multiple_user_access',
      'MEDIUM',
      'Múltiplos usuários do mesmo IP',
      suspicious_ips || ' IPs acessaram múltiplas contas na última hora',
      jsonb_build_object('count', suspicious_ips)
    );
  END IF;
END;
$function$;

-- 30. get_security_dashboard
CREATE OR REPLACE FUNCTION public.get_security_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
  login_stats JSONB;
  alert_stats JSONB;
  recent_activities JSONB[];
  policy_compliance JSONB;
BEGIN
  -- Estatísticas de login das últimas 24h
  SELECT jsonb_build_object(
    'total_attempts', COUNT(*),
    'successful_logins', COUNT(*) FILTER (WHERE success = true),
    'failed_attempts', COUNT(*) FILTER (WHERE success = false),
    'unique_ips', COUNT(DISTINCT ip_address),
    'blocked_ips', COUNT(DISTINCT ip_address) FILTER (WHERE success = false)
  ) INTO login_stats
  FROM public.login_attempts
  WHERE attempt_time > now() - interval '24 hours';
  
  -- Estatísticas de alertas
  SELECT jsonb_build_object(
    'total_alerts', COUNT(*),
    'unresolved_alerts', COUNT(*) FILTER (WHERE resolved = false),
    'critical_alerts', COUNT(*) FILTER (WHERE severity = 'CRITICAL' AND resolved = false),
    'high_alerts', COUNT(*) FILTER (WHERE severity = 'HIGH' AND resolved = false)
  ) INTO alert_stats
  FROM public.security_alerts
  WHERE created_at > now() - interval '7 days';
  
  -- Verificação de compliance das políticas
  policy_compliance := jsonb_build_object(
    'rls_enabled_tables', (
      SELECT COUNT(*)
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relrowsecurity = true
        AND n.nspname = 'public'
        AND c.relkind = 'r'
    ),
    'total_public_tables', (
      SELECT COUNT(*)
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.relname NOT LIKE 'pg_%'
    )
  );
  
  -- Construir resultado final
  result := jsonb_build_object(
    'timestamp', now(),
    'login_statistics', login_stats,
    'security_alerts', alert_stats,
    'policy_compliance', policy_compliance,
    'security_score', CASE
      WHEN (alert_stats->>'critical_alerts')::int > 0 THEN 'CRITICAL'
      WHEN (alert_stats->>'high_alerts')::int > 2 THEN 'HIGH_RISK'
      WHEN (login_stats->>'failed_attempts')::int > (login_stats->>'successful_logins')::int THEN 'MEDIUM_RISK'
      ELSE 'LOW_RISK'
    END
  );
  
  RETURN result;
END;
$function$;