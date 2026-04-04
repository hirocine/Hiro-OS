
-- Drop existing permissive public INSERT policies
DROP POLICY IF EXISTS "System can insert login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "System can insert security alerts" ON public.security_alerts;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notification status for all users" ON public.user_notification_status;

-- login_attempts: inserts come from SECURITY DEFINER functions, no client insert needed
-- No replacement INSERT policy needed — the SECURITY DEFINER function bypasses RLS

-- security_alerts: inserts come from SECURITY DEFINER functions only
-- No replacement INSERT policy needed

-- notifications: inserts come from SECURITY DEFINER function (create_notification_for_all_users)
-- No replacement INSERT policy needed

-- user_notification_status: inserts come from SECURITY DEFINER function (create_notification_for_all_users)
-- No replacement INSERT policy needed
