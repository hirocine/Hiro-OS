-- Migration para adicionar Foreign Keys e prevenir dados órfãos

-- 1. FK: loans.equipment_id -> equipments.id
-- Impede deletar equipamentos que têm empréstimos ativos
ALTER TABLE loans 
ADD CONSTRAINT fk_loans_equipment 
FOREIGN KEY (equipment_id) 
REFERENCES equipments(id) 
ON DELETE RESTRICT;

-- 2. FK: borrower_contacts.loan_id -> loans.id
-- Remove contatos quando o empréstimo for deletado
ALTER TABLE borrower_contacts 
ADD CONSTRAINT fk_borrower_contacts_loan 
FOREIGN KEY (loan_id) 
REFERENCES loans(id) 
ON DELETE CASCADE;

-- 3. FK: ssd_allocations.ssd_id -> equipments.id
-- Impede deletar SSDs que têm alocações
ALTER TABLE ssd_allocations 
ADD CONSTRAINT fk_ssd_allocations_ssd 
FOREIGN KEY (ssd_id) 
REFERENCES equipments(id) 
ON DELETE RESTRICT;

-- 4. FK: ssd_external_loans.ssd_id -> equipments.id
-- Impede deletar SSDs que estão emprestados
ALTER TABLE ssd_external_loans 
ADD CONSTRAINT fk_ssd_external_loans_ssd 
FOREIGN KEY (ssd_id) 
REFERENCES equipments(id) 
ON DELETE RESTRICT;

-- 5. FK: user_notification_status.notification_id -> notifications.id
-- Remove status quando notificação for deletada
ALTER TABLE user_notification_status 
ADD CONSTRAINT fk_user_notification_status_notification 
FOREIGN KEY (notification_id) 
REFERENCES notifications(id) 
ON DELETE CASCADE;

-- 6. FK: equipments.parent_id -> equipments.id (self-reference)
-- Impede acessórios ficarem órfãos
ALTER TABLE equipments 
ADD CONSTRAINT fk_equipments_parent 
FOREIGN KEY (parent_id) 
REFERENCES equipments(id) 
ON DELETE CASCADE;

-- 7. Criar índices para melhorar performance das FKs
CREATE INDEX IF NOT EXISTS idx_loans_equipment_id ON loans(equipment_id);
CREATE INDEX IF NOT EXISTS idx_borrower_contacts_loan_id ON borrower_contacts(loan_id);
CREATE INDEX IF NOT EXISTS idx_ssd_allocations_ssd_id ON ssd_allocations(ssd_id);
CREATE INDEX IF NOT EXISTS idx_ssd_external_loans_ssd_id ON ssd_external_loans(ssd_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_status_notification_id ON user_notification_status(notification_id);
CREATE INDEX IF NOT EXISTS idx_equipments_parent_id ON equipments(parent_id);

-- 8. Log da operação
INSERT INTO audit_logs (
  action,
  table_name,
  record_id,
  new_values
) VALUES (
  'add_foreign_keys',
  'system',
  NULL,
  jsonb_build_object(
    'operation', 'add_foreign_keys_for_data_integrity',
    'timestamp', now(),
    'constraints_added', ARRAY[
      'fk_loans_equipment',
      'fk_borrower_contacts_loan',
      'fk_ssd_allocations_ssd',
      'fk_ssd_external_loans_ssd',
      'fk_user_notification_status_notification',
      'fk_equipments_parent'
    ]
  )
);