-- Security Fix: Restrict audit log inserts to prevent malicious entries
-- This fixes ERROR vulnerability: Audit Log Integrity Could Be Compromised

-- Remove the overly permissive insert policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Create a restrictive policy that only allows service role inserts
-- Regular users cannot insert directly; must use log_audit_entry() function
CREATE POLICY "Only service role can insert audit logs"
ON public.audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Add policy to allow authenticated role inserts only from SECURITY DEFINER contexts
-- This allows the log_audit_entry function to work
CREATE POLICY "Authenticated context can insert via security definer"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  -- Only allow inserts if they come through proper channels
  -- The SECURITY DEFINER function will handle the actual insert
  false
);

-- Document the security model
COMMENT ON TABLE public.audit_logs IS 
'Audit log table - inserts must be performed through the log_audit_entry() SECURITY DEFINER function. Direct inserts are blocked to maintain audit integrity.';

COMMENT ON POLICY "Only service role can insert audit logs" ON public.audit_logs IS
'Allows service role to insert audit logs directly for system maintenance operations';

COMMENT ON POLICY "Authenticated context can insert via security definer" ON public.audit_logs IS
'Blocks direct inserts from authenticated users. All audit logging must use log_audit_entry() function which runs as SECURITY DEFINER and bypasses this policy.';