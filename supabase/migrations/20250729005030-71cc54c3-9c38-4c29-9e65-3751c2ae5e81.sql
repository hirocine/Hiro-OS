-- Criar bucket para imagens de equipamentos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('equipment-images', 'equipment-images', true);

-- Criar políticas para o bucket equipment-images
CREATE POLICY "Usuários autenticados podem ver imagens de equipamentos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'equipment-images');

CREATE POLICY "Usuários autenticados podem fazer upload de imagens de equipamentos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'equipment-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar imagens de equipamentos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'equipment-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem deletar imagens de equipamentos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'equipment-images' AND auth.uid() IS NOT NULL);