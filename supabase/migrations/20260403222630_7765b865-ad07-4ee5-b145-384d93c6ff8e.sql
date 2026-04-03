INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamento-assets', 'orcamento-assets', true);

CREATE POLICY "Authenticated users can upload orcamento assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'orcamento-assets');

CREATE POLICY "Authenticated users can update orcamento assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'orcamento-assets');

CREATE POLICY "Anyone can view orcamento assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'orcamento-assets');