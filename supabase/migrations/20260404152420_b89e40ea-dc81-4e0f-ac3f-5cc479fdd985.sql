
CREATE TABLE public.proposal_testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  image TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view testimonials"
  ON public.proposal_testimonials FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can create testimonials"
  ON public.proposal_testimonials FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update testimonials"
  ON public.proposal_testimonials FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete testimonials"
  ON public.proposal_testimonials FOR DELETE
  TO authenticated USING (true);

INSERT INTO public.proposal_testimonials (name, role, text, image)
VALUES (
  'Thiago Nigro',
  'CEO, Grupo Primo',
  'A Hiro elevou a qualidade do nosso conteúdo a outro patamar. O profissionalismo e a atenção aos detalhes fizeram toda a diferença no resultado final.',
  NULL
);
