
-- RLS policies for 'producao' role to access supplier tables
CREATE POLICY "Producao can view suppliers" ON public.suppliers FOR SELECT TO authenticated USING (has_role(auth.uid(), 'producao'::app_role));
CREATE POLICY "Producao can insert suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'producao'::app_role));
CREATE POLICY "Producao can update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'producao'::app_role));
CREATE POLICY "Producao can delete suppliers" ON public.suppliers FOR DELETE TO authenticated USING (has_role(auth.uid(), 'producao'::app_role));

CREATE POLICY "Producao can view supplier roles" ON public.supplier_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'producao'::app_role));
CREATE POLICY "Producao can insert supplier roles" ON public.supplier_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'producao'::app_role));
CREATE POLICY "Producao can update supplier roles" ON public.supplier_roles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'producao'::app_role));
CREATE POLICY "Producao can delete supplier roles" ON public.supplier_roles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'producao'::app_role));

CREATE POLICY "Producao can view supplier notes" ON public.supplier_notes FOR SELECT TO authenticated USING (has_role(auth.uid(), 'producao'::app_role));
CREATE POLICY "Producao can insert supplier notes" ON public.supplier_notes FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'producao'::app_role));
CREATE POLICY "Producao can update supplier notes" ON public.supplier_notes FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'producao'::app_role));
CREATE POLICY "Producao can delete supplier notes" ON public.supplier_notes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'producao'::app_role));

CREATE POLICY "Producao can view supplier companies" ON public.supplier_companies FOR SELECT TO authenticated USING (has_role(auth.uid(), 'producao'::app_role));
CREATE POLICY "Producao can insert supplier companies" ON public.supplier_companies FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'producao'::app_role));
CREATE POLICY "Producao can update supplier companies" ON public.supplier_companies FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'producao'::app_role));
CREATE POLICY "Producao can delete supplier companies" ON public.supplier_companies FOR DELETE TO authenticated USING (has_role(auth.uid(), 'producao'::app_role));

CREATE POLICY "Producao can view supplier company notes" ON public.supplier_company_notes FOR SELECT TO authenticated USING (has_role(auth.uid(), 'producao'::app_role));
CREATE POLICY "Producao can insert supplier company notes" ON public.supplier_company_notes FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'producao'::app_role));
CREATE POLICY "Producao can update supplier company notes" ON public.supplier_company_notes FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'producao'::app_role));
CREATE POLICY "Producao can delete supplier company notes" ON public.supplier_company_notes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'producao'::app_role));
