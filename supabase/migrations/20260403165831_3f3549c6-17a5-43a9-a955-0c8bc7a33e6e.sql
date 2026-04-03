ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS objetivo text,
  ADD COLUMN IF NOT EXISTS diagnostico_dores jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS list_price numeric,
  ADD COLUMN IF NOT EXISTS payment_options jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS testimonial_name text,
  ADD COLUMN IF NOT EXISTS testimonial_role text,
  ADD COLUMN IF NOT EXISTS testimonial_text text,
  ADD COLUMN IF NOT EXISTS testimonial_image text,
  ADD COLUMN IF NOT EXISTS entregaveis jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cases jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS whatsapp_number text;