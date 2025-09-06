-- CORREÇÃO: Remover SECURITY DEFINER da view
-- Views não devem usar SECURITY DEFINER, apenas funções

-- 1. Recriar a view sem SECURITY DEFINER
DROP VIEW IF EXISTS public.equipment_safe_view;

-- 2. Criar view normal (sem SECURITY DEFINER)
CREATE VIEW public.equipment_safe_view AS
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
  -- Mascarar dados financeiros para não-admins
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN e.value
    ELSE NULL
  END as value,
  e.patrimony_number,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN e.depreciated_value
    ELSE NULL
  END as depreciated_value,
  e.receive_date,
  -- Mascarar informações comerciais para não-admins
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN e.store
    ELSE NULL
  END as store,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN e.invoice
    ELSE NULL
  END as invoice,
  e.current_loan_id,
  e.current_borrower,
  e.last_loan_date,
  e.simplified_status,
  e.created_at,
  e.updated_at
FROM public.equipments e
WHERE 
  -- Admins podem ver tudo
  has_role(auth.uid(), 'admin'::app_role) OR
  -- Usuários podem ver equipamentos de seus projetos
  user_can_access_equipment(e.id);

-- 3. Habilitar RLS na view também (boa prática)
ALTER VIEW public.equipment_safe_view SET (security_barrier = true);

-- 4. Criar função alternativa para obter equipamentos com dados seguros
CREATE OR REPLACE FUNCTION public.get_safe_equipment_list()
RETURNS TABLE(
  id UUID,
  name TEXT,
  brand TEXT,
  category TEXT,
  subcategory TEXT,
  custom_category TEXT,
  status TEXT,
  item_type TEXT,
  parent_id UUID,
  serial_number TEXT,
  purchase_date DATE,
  last_maintenance DATE,
  description TEXT,
  image TEXT,
  value NUMERIC,
  patrimony_number TEXT,
  depreciated_value NUMERIC,
  receive_date DATE,
  store TEXT,
  invoice TEXT,
  current_loan_id UUID,
  current_borrower TEXT,
  last_loan_date DATE,
  simplified_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
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
    -- Mascarar dados financeiros para não-admins
    CASE 
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN e.value
      ELSE NULL
    END as value,
    e.patrimony_number,
    CASE 
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN e.depreciated_value
      ELSE NULL
    END as depreciated_value,
    e.receive_date,
    -- Mascarar informações comerciais para não-admins
    CASE 
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN e.store
      ELSE NULL
    END as store,
    CASE 
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN e.invoice
      ELSE NULL
    END as invoice,
    e.current_loan_id,
    e.current_borrower,
    e.last_loan_date,
    e.simplified_status,
    e.created_at,
    e.updated_at
  FROM public.equipments e
  WHERE 
    -- Admins podem ver tudo
    has_role(auth.uid(), 'admin'::app_role) OR
    -- Usuários podem ver equipamentos de seus projetos
    user_can_access_equipment(e.id);
END;
$function$;