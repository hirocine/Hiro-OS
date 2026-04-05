

# Tracking seguro com SECURITY DEFINER function

## Resumo
Criar a infraestrutura de tracking de propostas usando uma function `SECURITY DEFINER` para o incremento, em vez de policy de UPDATE pública. A function encapsula o incremento de `views_count` e a mudança de status.

## 1. Migration SQL (arquivo novo em `supabase/migrations/`)

Uma única migration com:

```sql
-- Tabela de views
CREATE TABLE public.proposal_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid REFERENCES public.orcamentos(id) ON DELETE CASCADE NOT NULL,
  viewed_at timestamptz DEFAULT now() NOT NULL,
  ip_address text,
  user_agent text,
  device_type text,
  referrer text,
  time_on_page_seconds integer
);

ALTER TABLE public.proposal_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on proposal_views" ON public.proposal_views
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated read on proposal_views" ON public.proposal_views
FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX idx_proposal_views_proposal_id ON public.proposal_views(proposal_id);

-- Coluna views_count
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;

-- Function SECURITY DEFINER para incremento seguro
CREATE OR REPLACE FUNCTION public.increment_proposal_views(proposal_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.orcamentos
  SET views_count = COALESCE(views_count, 0) + 1,
      status = CASE WHEN status IN ('sent', 'draft') THEN 'opened' ELSE status END
  WHERE id = proposal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Sem policy de UPDATE pública** -- a function roda com permissão elevada.

## 2. Tipo Proposal (`src/features/proposals/types/index.ts`)
Adicionar `views_count: number;` na interface (após `company_description`).

## 3. Hook useProposalDetails (`src/features/proposals/hooks/useProposalDetails.ts`)
Adicionar `views_count: (data as any).views_count || 0` no mapeamento.

## 4. ProposalPublicPage (`src/features/proposals/components/ProposalPublicPage.tsx`)
Adicionar `useEffect` + `useRef` que:
- Insere registro em `proposal_views` (user_agent, device_type, referrer)
- Chama `supabase.rpc('increment_proposal_views', { proposal_id: proposal.id })` em vez de `.update()` direto
- Guarda `view_id` num ref para o `beforeunload` (update de `time_on_page_seconds`)
- Guarda timestamp de entrada para calcular tempo na página

## 5. ProposalCard (`src/features/proposals/components/ProposalCard.tsx`)
Adicionar indicador:
- `views_count > 0`: ícone Eye + contagem
- `views_count === 0`: texto muted "Não visualizada"

## Arquivos modificados
- Migration SQL (nova)
- `src/features/proposals/types/index.ts`
- `src/features/proposals/hooks/useProposalDetails.ts`
- `src/features/proposals/components/ProposalPublicPage.tsx`
- `src/features/proposals/components/ProposalCard.tsx`

Nenhum outro arquivo em `src/features/proposals/components/public/` será alterado.

