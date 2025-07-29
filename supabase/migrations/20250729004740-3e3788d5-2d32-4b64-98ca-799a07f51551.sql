-- Limpar base de dados mantendo estrutura e dados de usuários

-- 1. Deletar empréstimos primeiro (podem referenciar equipamentos)
DELETE FROM public.loans;

-- 2. Deletar equipamentos (podem ter dependências parent_id internas)
DELETE FROM public.equipments;

-- 3. Deletar projetos
DELETE FROM public.projects;

-- 4. Deletar logs de auditoria
DELETE FROM public.audit_logs;

-- Verificar que as tabelas estão vazias
SELECT 
  'loans' as tabela, COUNT(*) as registros FROM public.loans
UNION ALL
SELECT 
  'equipments' as tabela, COUNT(*) as registros FROM public.equipments  
UNION ALL
SELECT 
  'projects' as tabela, COUNT(*) as registros FROM public.projects
UNION ALL
SELECT 
  'audit_logs' as tabela, COUNT(*) as registros FROM public.audit_logs;