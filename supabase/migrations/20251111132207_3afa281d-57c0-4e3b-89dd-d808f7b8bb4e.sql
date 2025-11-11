-- Adicionar coluna category à tabela company_policies
ALTER TABLE company_policies 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Geral';

-- Adicionar índice para melhor performance em queries filtradas
CREATE INDEX IF NOT EXISTS idx_company_policies_category ON company_policies(category);

-- Comentário para documentação
COMMENT ON COLUMN company_policies.category IS 'Categoria da política para organização e filtros';