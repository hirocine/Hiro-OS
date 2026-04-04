ALTER TABLE public.orcamentos ALTER COLUMN client_name DROP NOT NULL;
ALTER TABLE public.orcamentos ALTER COLUMN project_name DROP NOT NULL;
ALTER TABLE public.orcamentos ALTER COLUMN validity_date DROP NOT NULL;