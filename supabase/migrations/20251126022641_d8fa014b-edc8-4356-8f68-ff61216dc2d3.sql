-- Remove conflicting INSERT policy on audit_logs
-- This policy was denying all inserts, conflicting with the service_role policy
DROP POLICY IF EXISTS "Authenticated context can insert via security definer" ON public.audit_logs;

-- The "Only service role can insert audit logs" policy remains active
-- This ensures only backend functions can insert audit logs