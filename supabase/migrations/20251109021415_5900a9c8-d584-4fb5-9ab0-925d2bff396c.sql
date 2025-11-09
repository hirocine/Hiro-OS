-- Limpeza Total do Histórico de Projetos
-- ATENÇÃO: Esta operação é IRREVERSÍVEL
-- Os triggers cleanup_project_loans e sync_equipment_loan_status cuidarão da sincronização

-- 1. Deletar todos os projetos
-- O trigger cleanup_project_loans vai:
--   - Marcar todos os loans como returned
--   - Atualizar equipamentos via sync_equipment_loan_status
DELETE FROM projects;

-- 2. Garantir que equipamentos estão sincronizados
SELECT manual_sync_equipment_status();

-- 3. Limpar notificações relacionadas a projetos e loans
DELETE FROM user_notification_status 
WHERE notification_id IN (
  SELECT id FROM notifications 
  WHERE related_entity IN ('projects', 'loans')
);

DELETE FROM notifications 
WHERE related_entity IN ('projects', 'loans');

-- 4. Registrar a limpeza no audit log
SELECT log_audit_entry(
  'system_cleanup',
  'system',
  NULL,
  NULL,
  jsonb_build_object(
    'action', 'full_project_history_cleanup',
    'description', 'Limpeza completa do histórico de projetos, loans e notificações relacionadas',
    'projects_deleted', 6,
    'loans_affected', 13,
    'equipment_freed', 8,
    'timestamp', now()
  )
);

-- 5. Verificação final e relatório
DO $$
DECLARE
  v_projects_count INTEGER;
  v_active_loans INTEGER;
  v_returned_loans INTEGER;
  v_equipment_available INTEGER;
  v_equipment_in_project INTEGER;
  v_project_notifications INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_projects_count FROM projects;
  SELECT COUNT(*) INTO v_active_loans FROM loans WHERE status IN ('active', 'overdue');
  SELECT COUNT(*) INTO v_returned_loans FROM loans WHERE status = 'returned';
  SELECT COUNT(*) INTO v_equipment_available FROM equipments WHERE simplified_status = 'available';
  SELECT COUNT(*) INTO v_equipment_in_project FROM equipments WHERE simplified_status = 'in_project';
  SELECT COUNT(*) INTO v_project_notifications FROM notifications WHERE related_entity IN ('projects', 'loans');
  
  -- Verificar se a limpeza foi bem sucedida
  IF v_projects_count > 0 THEN
    RAISE EXCEPTION 'Limpeza falhou: ainda existem % projetos no banco', v_projects_count;
  END IF;
  
  IF v_active_loans > 0 THEN
    RAISE EXCEPTION 'Limpeza falhou: ainda existem % loans ativos', v_active_loans;
  END IF;
  
  IF v_equipment_in_project > 0 THEN
    RAISE EXCEPTION 'Limpeza falhou: ainda existem % equipamentos marcados como in_project', v_equipment_in_project;
  END IF;
  
  IF v_project_notifications > 0 THEN
    RAISE WARNING 'Ainda existem % notificações de projetos/loans', v_project_notifications;
  END IF;
  
  RAISE NOTICE 'Limpeza concluída com sucesso!';
  RAISE NOTICE '  - Projetos: %', v_projects_count;
  RAISE NOTICE '  - Loans ativos: %', v_active_loans;
  RAISE NOTICE '  - Loans devolvidos: %', v_returned_loans;
  RAISE NOTICE '  - Equipamentos disponíveis: %', v_equipment_available;
  RAISE NOTICE '  - Equipamentos em projeto: %', v_equipment_in_project;
  RAISE NOTICE '  - Notificações de projetos: %', v_project_notifications;
END $$;