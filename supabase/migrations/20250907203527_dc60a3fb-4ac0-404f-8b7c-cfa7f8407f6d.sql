-- Security Enhancement Phase 1: Core Security Improvements

-- 1. Create security monitoring functions
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  suspicious_ips INTEGER;
  failed_logins INTEGER;
  rec RECORD;
BEGIN
  -- Detect IPs with excessive failed login attempts
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
      'IP with excessive login attempts',
      'IP ' || rec.ip_address::text || ' made ' || rec.attempts || ' failed attempts in the last hour',
      jsonb_build_object(
        'ip_address', rec.ip_address,
        'attempts', rec.attempts,
        'timeframe', '1 hour'
      )
    );
  END LOOP;
  
  -- Detect anomalous access patterns in audit logs
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
      'Multiple users from same IP',
      suspicious_ips || ' IPs accessed multiple accounts in the last hour',
      jsonb_build_object('count', suspicious_ips)
    );
  END IF;
END;
$$;

-- 2. Create function to sanitize old audit logs (data protection)
CREATE OR REPLACE FUNCTION public.sanitize_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Mask emails and phones in logs older than 30 days
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
    AND action != 'sanitize_logs'; -- Avoid recursion
    
  -- Log the sanitization operation
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
$$;

-- 3. Create comprehensive security monitoring function
CREATE OR REPLACE FUNCTION public.monitor_contact_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  suspicious_access RECORD;
BEGIN
  -- Detect non-admin users accessing too much contact data
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
      'Excessive personal data access',
      'User ' || suspicious_access.user_id || ' accessed ' || suspicious_access.access_count || ' contact records in the last hour',
      jsonb_build_object(
        'user_id', suspicious_access.user_id,
        'access_count', suspicious_access.access_count,
        'timeframe', '1 hour'
      )
    );
  END LOOP;
END;
$$;

-- 4. Create security maintenance function that runs all security tasks
CREATE OR REPLACE FUNCTION public.run_security_maintenance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Execute log sanitization
  PERFORM public.sanitize_audit_logs();
  
  -- Execute access monitoring
  PERFORM public.monitor_contact_access();
  
  -- Detect suspicious activities
  PERFORM public.detect_suspicious_activity();
  
  -- Log maintenance execution
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
$$;

-- 5. Create function for comprehensive security scanning
CREATE OR REPLACE FUNCTION public.run_complete_security_scan()
RETURNS TABLE(
  scan_id uuid,
  scan_timestamp timestamp with time zone,
  vulnerabilities_found integer,
  critical_issues integer,
  high_issues integer,
  medium_issues integer,
  low_issues integer,
  scan_summary jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _scan_id UUID := gen_random_uuid();
  _vulnerabilities INTEGER := 0;
  _critical INTEGER := 0;
  _high INTEGER := 0;
  _medium INTEGER := 0;
  _low INTEGER := 0;
  _summary JSONB;
BEGIN
  -- Execute security maintenance
  PERFORM public.run_security_maintenance();
  
  -- Count unresolved alerts by severity
  SELECT 
    COUNT(*) FILTER (WHERE severity = 'CRITICAL'),
    COUNT(*) FILTER (WHERE severity = 'HIGH'),
    COUNT(*) FILTER (WHERE severity = 'MEDIUM'),
    COUNT(*) FILTER (WHERE severity = 'LOW')
  INTO _critical, _high, _medium, _low
  FROM public.security_alerts
  WHERE resolved = false;
  
  _vulnerabilities := _critical + _high + _medium + _low;
  
  -- Create scan summary
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
      WHEN _critical > 0 THEN 'Immediately resolve critical vulnerabilities'
      WHEN _high > 0 THEN 'Prioritize high severity vulnerabilities'
      WHEN _medium > 0 THEN 'Consider resolving medium vulnerabilities'
      ELSE 'System security status is good'
    END
  );
  
  -- Log scan execution
  PERFORM public.log_audit_entry(
    'security_scan_completed',
    'system',
    _scan_id::text,
    NULL,
    _summary
  );
  
  -- Return results
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
$$;