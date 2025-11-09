-- Migration para limpar dados órfãos e sincronizar status de equipamentos

-- 1. Marcar loans órfãos (sem projeto válido) como retornados
-- Isso evita inconsistências e garante que equipamentos sejam liberados
UPDATE loans 
SET 
  status = 'returned',
  actual_return_date = CURRENT_DATE,
  return_notes = 'Equipamento retornado automaticamente - projeto não encontrado',
  return_condition = 'good'
WHERE status IN ('active', 'overdue')
  AND project IS NOT NULL
  AND project NOT IN (
    SELECT name FROM projects 
    UNION ALL 
    SELECT id::text FROM projects
  );

-- 2. Sincronizar status de todos os equipamentos
-- Usa a função existente que corrige referências órfãs e status incorretos
SELECT manual_sync_equipment_status();

-- 3. Log da operação de limpeza
INSERT INTO audit_logs (
  action,
  table_name,
  record_id,
  new_values
) VALUES (
  'data_cleanup',
  'system',
  NULL,
  jsonb_build_object(
    'operation', 'cleanup_orphan_loans_and_sync_equipment',
    'timestamp', now(),
    'description', 'Cleaned orphan loans and synchronized equipment status'
  )
);