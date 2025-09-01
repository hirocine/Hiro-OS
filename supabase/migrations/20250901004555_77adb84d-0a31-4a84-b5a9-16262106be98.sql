-- =============================================
-- HABILITAR PROTEÇÃO CONTRA SENHAS VAZADAS
-- =============================================

-- Esta configuração precisa ser feita via dashboard, mas vamos documentar e criar função de verificação

-- Função para verificar configurações de segurança de senha
CREATE OR REPLACE FUNCTION public.check_password_security_settings()
RETURNS TABLE(
  setting_name TEXT,
  current_status TEXT,
  recommendation TEXT,
  priority TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- =============================================
-- IMPLEMENTAR RATE LIMITING NO CÓDIGO
-- =============================================

-- Tabela para tracking de tentativas de login
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  user_email TEXT,
  attempt_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  success BOOLEAN DEFAULT false,
  failure_reason TEXT,
  user_agent TEXT
);

-- Habilitar RLS na tabela de tentativas de login
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Política: apenas admins podem ver tentativas de login
CREATE POLICY "Admins can view login attempts" 
ON public.login_attempts FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Sistema pode inserir tentativas
CREATE POLICY "System can insert login attempts" 
ON public.login_attempts FOR INSERT 
WITH CHECK (true);

-- Função para verificar rate limiting
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
  _ip_address INET,
  _user_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- Função para registrar tentativa de login
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  _ip_address INET,
  _user_email TEXT,
  _success BOOLEAN,
  _failure_reason TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- =============================================
-- MONITORAMENTO E ALERTAS DE SEGURANÇA
-- =============================================

-- Tabela para alertas de segurança
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas para alertas de segurança
CREATE POLICY "Admins can view security alerts" 
ON public.security_alerts FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert security alerts" 
ON public.security_alerts FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update security alerts" 
ON public.security_alerts FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Função para criar alerta de segurança
CREATE OR REPLACE FUNCTION public.create_security_alert(
  _alert_type TEXT,
  _severity TEXT,
  _title TEXT,
  _description TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- Função para detectar atividades suspeitas
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- =============================================
-- DASHBOARD DE SEGURANÇA - FUNÇÃO DE RELATÓRIO
-- =============================================

CREATE OR REPLACE FUNCTION public.get_security_dashboard()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;