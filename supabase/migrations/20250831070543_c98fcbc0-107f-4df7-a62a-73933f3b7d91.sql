-- Criar função para buscar equipamentos de um projeto de forma segura
CREATE OR REPLACE FUNCTION get_project_equipment(_project_id UUID)
RETURNS TABLE (
  equipment_id UUID,
  equipment_name TEXT,
  equipment_brand TEXT,
  equipment_category TEXT,
  equipment_subcategory TEXT,
  equipment_custom_category TEXT,
  equipment_status TEXT,
  equipment_item_type TEXT,
  equipment_parent_id UUID,
  equipment_serial_number TEXT,
  equipment_purchase_date DATE,
  equipment_last_maintenance DATE,
  equipment_description TEXT,
  equipment_image TEXT,
  equipment_value NUMERIC,
  equipment_patrimony_number TEXT,
  equipment_depreciated_value NUMERIC,
  equipment_receive_date DATE,
  equipment_store TEXT,
  equipment_invoice TEXT,
  equipment_current_loan_id UUID,
  equipment_current_borrower TEXT,
  equipment_last_loan_date DATE,
  loan_id UUID,
  loan_borrower_name TEXT,
  loan_date DATE,
  loan_expected_return_date DATE,
  loan_status TEXT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    e.id,
    e.name,
    e.brand,
    e.category,
    e.subcategory,
    e.custom_category,
    e.status,
    e.item_type,
    e.parent_id,
    e.serial_number,
    e.purchase_date,
    e.last_maintenance,
    e.description,
    e.image,
    e.value,
    e.patrimony_number,
    e.depreciated_value,
    e.receive_date,
    e.store,
    e.invoice,
    e.current_loan_id,
    e.current_borrower,
    e.last_loan_date,
    l.id,
    l.borrower_name,
    l.loan_date,
    l.expected_return_date,
    l.status
  FROM public.equipments e
  INNER JOIN public.loans l ON l.equipment_id = e.id
  INNER JOIN public.projects p ON (l.project = p.name OR l.project = p.id::text)
  WHERE p.id = _project_id 
    AND l.status IN ('active', 'overdue')
  ORDER BY l.loan_date DESC;
$$;