-- Deletar todos os logs de auditoria
DELETE FROM public.audit_logs;

-- Log da operação de limpeza
INSERT INTO public.audit_logs (
  user_id,
  action,
  table_name,
  record_id,
  new_values
) VALUES (
  auth.uid(),
  'cleanup_audit_logs',
  'audit_logs',
  NULL,
  jsonb_build_object(
    'cleaned_at', now(),
    'reason', 'manual_cleanup'
  )
);