-- Fase 2: Corrigir estados inconsistentes de equipamentos
-- Especialmente SSDs e outros equipamentos marcados como 'in_project' sem empréstimos ativos

-- Executar função de sincronização manual
SELECT manual_sync_equipment_status();

-- Criar log da operação de limpeza
INSERT INTO audit_logs (
  action,
  table_name,
  record_id,
  new_values
) VALUES (
  'equipment_status_sync',
  'equipments',
  NULL,
  jsonb_build_object(
    'executed_at', now(),
    'reason', 'fix_inconsistent_states',
    'description', 'Synchronized equipment status to fix inconsistencies between simplified_status and actual loan status'
  )
);