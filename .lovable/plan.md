

# Redesenhar header do ProposalOverview

## Mudança (arquivo único: `src/pages/ProposalOverview.tsx`)

### Substituir o header card (linhas 84-131) + remover os 4 cards de métricas (linhas 133-173)

Novo card com duas áreas separadas por `border-t`:

**Area superior** (`p-5 flex items-start gap-4`):
- Avatar 64x64 `rounded-lg` com fallback Building2
- Centro (`flex-1`):
  - L1: nome do projeto (`text-lg font-medium`) + Badge de status inline
  - L2: `{client_name} · {client_responsible}` em `text-sm text-muted-foreground`
  - L3: datas em `text-xs text-muted-foreground/60` separadas por " · "

**Area inferior** (`border-t p-3 px-5 flex items-center justify-between`):
- Esquerda: métricas inline (`flex items-center gap-4 text-sm text-muted-foreground`):
  - `Eye` icon + `{totalViews} visualizações`
  - `Clock` icon + `Última: {dd/MM HH:mm}` (ou "—")
- Direita: 3 botões (Copiar Link outline/sm, Editar outline/sm, Ver Proposta default/sm)

### Remover
- Os 4 cards de métricas (linhas 134-173) -- visualizações e última view já estão no footer do header; tempo médio e versão removidos.
- Imports não usados: `Calendar`, `Hash`, `CardHeader`, `CardTitle` (se não usados em outros cards -- verificar). Manter `CardHeader`/`CardTitle` pois são usados nas seções 3-4.

Nenhum arquivo em `src/features/proposals/components/public/` será alterado.

