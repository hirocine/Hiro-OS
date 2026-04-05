

# Fase 2 — Página Gerencial de Proposta (ProposalOverview)

## Resumo
Criar uma página intermediária de overview entre a listagem e a edição de propostas, com métricas de visualização, dados do cliente e histórico de views.

## 1. Hook: `src/features/proposals/hooks/useProposalViews.ts`
Query simples que busca todos os registros de `proposal_views` para um `proposal_id`, ordenados por `viewed_at` desc. Usa `as any` para contornar tipagem (tabela não está no types.ts gerado).

## 2. Nova página: `src/pages/ProposalOverview.tsx`
Usa `useParams` para pegar o `id`, busca dados com `useProposalDetailsById` e views com `useProposalViews`.

Layout com `ResponsiveContainer` + `BreadcrumbNav` (Orçamentos > Nome do Projeto):

**Seção 1 — Header Card:**
- Logo do cliente (Avatar com fallback Building2) + nome do projeto + cliente
- Badge de status (reutilizar statusMap)
- Datas: criação, envio, validade
- Botões: "Editar Proposta" (`/orcamentos/${id}`), "Ver Proposta" (abre link público), "Copiar Link"

**Seção 2 — Cards de métricas (grid 4 colunas):**
- Total de visualizações (`views_count`)
- Última visualização (primeiro item do array de views, formatado)
- Tempo médio na página (média de `time_on_page_seconds`, formatado em min:seg)
- Versão atual (placeholder "v1")

Usar o padrão StatsCard com `border-l-4` colorida.

**Seção 3 — Dados do cliente:**
Card com grid 2 colunas mostrando: cliente, projeto, responsável, whatsapp, descrição da empresa. Read-only. Link "Editar" que navega para `/orcamentos/${id}`.

**Seção 4 — Histórico de visualizações:**
Tabela com colunas: Data/Hora, Dispositivo (ícone Monitor/Smartphone), Tempo na página, Referrer. Dados do hook `useProposalViews`. Estado vazio se não há views.

**Seção 5 — Placeholder:**
Card simples com texto "Histórico de alterações — em breve" em muted.

## 3. Rota em `App.tsx`
Adicionar lazy import de `ProposalOverview` e rota `/orcamentos/:id/overview` dentro do bloco protegido, antes da rota `/orcamentos/:id`.

## 4. Navegação no `ProposalCard.tsx`
Linha 149: trocar `/orcamentos/${proposal.id}` para `/orcamentos/${proposal.id}/overview`.

## Arquivos criados/modificados
- **Novo:** `src/features/proposals/hooks/useProposalViews.ts`
- **Novo:** `src/pages/ProposalOverview.tsx`
- **Editado:** `src/App.tsx` (rota)
- **Editado:** `src/features/proposals/components/ProposalCard.tsx` (navegação)

Nenhum arquivo em `src/features/proposals/components/public/` será alterado.

