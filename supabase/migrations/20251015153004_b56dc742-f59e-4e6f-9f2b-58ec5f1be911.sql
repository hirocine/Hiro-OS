-- Performance Indexes para Fase 2
-- Criação de índices para otimizar queries frequentes

-- CRÍTICO: Índice para ssd_allocations (elimina N+1 queries na página de SSDs)
CREATE INDEX IF NOT EXISTS idx_ssd_allocations_ssd_id 
ON ssd_allocations(ssd_id);

-- IMPORTANTE: Índice composto para carregar SSDs mais rápido
CREATE INDEX IF NOT EXISTS idx_equipments_category_display_order 
ON equipments(category, display_order) 
WHERE category = 'storage';

-- MÉDIO: Índices para audit logs no painel de admin
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
ON audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_created 
ON audit_logs(table_name, created_at DESC);

-- BAIXO: Índice para filtro de usuários internos
CREATE INDEX IF NOT EXISTS idx_equipments_internal_user 
ON equipments(internal_user_id) 
WHERE internal_user_id IS NOT NULL;