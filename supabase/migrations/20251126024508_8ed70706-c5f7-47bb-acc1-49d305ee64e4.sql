-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  primary_role TEXT NOT NULL,
  secondary_role TEXT,
  whatsapp TEXT,
  instagram TEXT,
  portfolio_url TEXT,
  expertise TEXT NOT NULL DEFAULT 'media' 
    CHECK (expertise IN ('altissima', 'alta', 'media', 'baixa', 'muito_baixa')),
  daily_rate DECIMAL(10,2),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create supplier_roles table for categories
CREATE TABLE public.supplier_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 999,
  is_custom BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create supplier_notes table for internal notes
CREATE TABLE public.supplier_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert initial supplier roles
INSERT INTO supplier_roles (name, display_order, is_custom) VALUES
  ('Diretor de Fotografia', 10, false),
  ('Operador de Câmera', 20, false),
  ('Assistente de Câmera', 30, false),
  ('Técnico de Som', 40, false),
  ('Diretor de Arte', 50, false),
  ('Produtor', 60, false),
  ('Editor', 70, false),
  ('Colorista', 80, false),
  ('Gaffer', 90, false),
  ('Eletricista', 100, false),
  ('Maquinista', 110, false),
  ('Maquiador', 120, false),
  ('Figurinista', 130, false),
  ('Logger', 140, false),
  ('Outro', 999, false);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Authenticated users can view suppliers"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert suppliers"
  ON public.suppliers FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update suppliers"
  ON public.suppliers FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete suppliers"
  ON public.suppliers FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for supplier_roles
CREATE POLICY "Authenticated users can view supplier roles"
  ON public.supplier_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert supplier roles"
  ON public.supplier_roles FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update supplier roles"
  ON public.supplier_roles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete supplier roles"
  ON public.supplier_roles FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for supplier_notes
CREATE POLICY "Authenticated users can view supplier notes"
  ON public.supplier_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert supplier notes"
  ON public.supplier_notes FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update supplier notes"
  ON public.supplier_notes FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete supplier notes"
  ON public.supplier_notes FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_notes_updated_at
  BEFORE UPDATE ON public.supplier_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();