
-- Create supplier_companies table
CREATE TABLE public.supplier_companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL,
  area text NOT NULL,
  rating integer,
  whatsapp text,
  instagram text,
  portfolio_url text,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_companies ENABLE ROW LEVEL SECURITY;

-- RLS policies (same as suppliers - admin only)
CREATE POLICY "Admins can view supplier companies"
ON public.supplier_companies FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert supplier companies"
ON public.supplier_companies FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update supplier companies"
ON public.supplier_companies FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete supplier companies"
ON public.supplier_companies FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create supplier_company_notes table
CREATE TABLE public.supplier_company_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.supplier_companies(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid,
  created_by_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_company_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies (same as supplier_notes - admin only)
CREATE POLICY "Admins can view supplier company notes"
ON public.supplier_company_notes FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert supplier company notes"
ON public.supplier_company_notes FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update supplier company notes"
ON public.supplier_company_notes FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete supplier company notes"
ON public.supplier_company_notes FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on supplier_companies
CREATE TRIGGER update_supplier_companies_updated_at
BEFORE UPDATE ON public.supplier_companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on supplier_company_notes
CREATE TRIGGER update_supplier_company_notes_updated_at
BEFORE UPDATE ON public.supplier_company_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
