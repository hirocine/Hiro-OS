-- Criar tabela de políticas da empresa
CREATE TABLE company_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  icon_url TEXT,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  display_order INTEGER DEFAULT 999
);

-- Índice para ordenação
CREATE INDEX idx_policies_order ON company_policies(display_order);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_company_policies_updated_at
  BEFORE UPDATE ON company_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: Todos autenticados podem visualizar
CREATE POLICY "Authenticated users can view policies"
  ON company_policies FOR SELECT
  TO authenticated
  USING (true);

-- RLS: Apenas admins podem criar
CREATE POLICY "Admins can insert policies"
  ON company_policies FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS: Apenas admins podem editar
CREATE POLICY "Admins can update policies"
  ON company_policies FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- RLS: Apenas admins podem deletar
CREATE POLICY "Admins can delete policies"
  ON company_policies FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Habilitar RLS
ALTER TABLE company_policies ENABLE ROW LEVEL SECURITY;