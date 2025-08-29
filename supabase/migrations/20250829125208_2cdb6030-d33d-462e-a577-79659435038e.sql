-- Criar tabela para filtros salvos
CREATE TABLE public.saved_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own saved filters" 
ON public.saved_filters 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved filters" 
ON public.saved_filters 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved filters" 
ON public.saved_filters 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved filters" 
ON public.saved_filters 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_saved_filters_updated_at
BEFORE UPDATE ON public.saved_filters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_saved_filters_user_id ON public.saved_filters(user_id);
CREATE INDEX idx_saved_filters_created_at ON public.saved_filters(created_at DESC);