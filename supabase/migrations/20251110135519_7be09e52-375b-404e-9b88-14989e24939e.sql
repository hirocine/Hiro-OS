-- Habilitar REPLICA IDENTITY para capturar dados completos das mudanças
ALTER TABLE company_policies REPLICA IDENTITY FULL;

-- Adicionar tabela company_policies à publicação real-time do Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE company_policies;