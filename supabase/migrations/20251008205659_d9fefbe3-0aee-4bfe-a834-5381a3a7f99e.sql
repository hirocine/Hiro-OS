-- Adicionar coluna para usuário responsável interno na tabela equipments
ALTER TABLE public.equipments 
ADD COLUMN IF NOT EXISTS internal_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Criar tabela para alocações de projetos em SSDs/HDs
CREATE TABLE IF NOT EXISTS public.ssd_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ssd_id UUID REFERENCES public.equipments(id) ON DELETE CASCADE NOT NULL,
  project_name TEXT NOT NULL,
  allocated_gb NUMERIC NOT NULL CHECK (allocated_gb > 0),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Criar trigger para atualizar updated_at em ssd_allocations
CREATE TRIGGER update_ssd_allocations_updated_at
  BEFORE UPDATE ON public.ssd_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies para ssd_allocations
ALTER TABLE public.ssd_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view allocations"
  ON public.ssd_allocations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert allocations"
  ON public.ssd_allocations FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update allocations"
  ON public.ssd_allocations FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete allocations"
  ON public.ssd_allocations FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar tabela para empréstimos externos de SSDs/HDs
CREATE TABLE IF NOT EXISTS public.ssd_external_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ssd_id UUID REFERENCES public.equipments(id) ON DELETE CASCADE NOT NULL,
  borrower_name TEXT NOT NULL,
  loan_date DATE NOT NULL,
  expected_return_date DATE NOT NULL,
  actual_return_date DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT valid_dates CHECK (expected_return_date >= loan_date)
);

-- Criar trigger para atualizar updated_at em ssd_external_loans
CREATE TRIGGER update_ssd_external_loans_updated_at
  BEFORE UPDATE ON public.ssd_external_loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies para ssd_external_loans
ALTER TABLE public.ssd_external_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view external loans"
  ON public.ssd_external_loans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert external loans"
  ON public.ssd_external_loans FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update external loans"
  ON public.ssd_external_loans FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete external loans"
  ON public.ssd_external_loans FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));