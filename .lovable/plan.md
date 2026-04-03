

# Melhorias no Formulário de Propostas

## 4 alterações principais

### 1. Cases: Thumbnail do Vimeo + Tags múltiplas

**Thumbnail**: Usar a API do Vimeo para thumbs: `https://vimg.net/video/{vimeo_id}.jpg` (imagem de preview). Exibir na lista de seleção ao lado do texto.

**Tags múltiplas**: Alterar `tipo` de text simples para um array de tags. Tags pré-definidas: Marketing Digital, Eventos, Criativos, Fotografia, Publicidade, Motion, VFX. O usuário seleciona múltiplas via multi-select. Na proposta pública, exibe apenas a primeira tag.

- **Migration**: Alterar coluna `tipo` de `TEXT` para `TEXT[]` (array), ou adicionar coluna `tags TEXT[]` e manter `tipo` como a primeira tag.
- **`useProposalCases.ts`**: Atualizar tipo e mutation.
- **`ProposalWizard.tsx` (Step 2)**: Mostrar thumbnail + multi-select de tags no form e na lista de seleção.
- **`types/index.ts`**: `ProposalCase.tipo` → `string[]` (ou novo campo `tags`).

### 2. Entregáveis: Mostrar ícone visual no select

No select de ícones, renderizar o ícone Lucide ao lado do texto usando dynamic import ou um mapa de componentes.

- **`ProposalWizard.tsx` (Step 3)**: Criar mapa `{ Video: VideoIcon, ... }` e renderizar o ícone dentro de cada `SelectItem` e no `SelectValue`.

### 3. Investimento: Corrigir lógica de cálculo

Lógica atual (errada): usuário preenche `base_value` (valor cheio) e desconto → calcula final.

Lógica correta: usuário preenche `list_price` (valor de tabela, riscado) e desconto% → sistema calcula `base_value` (valor final).

- **`ProposalWizard.tsx` (Step 5)**: 
  - Campo 1: "Valor de Tabela (R$)" → `list_price` (obrigatório)
  - Campo 2: "Desconto (%)" → `discount_pct`
  - Preview automático: valor de tabela riscado + badge desconto + valor final = `list_price * (1 - discount_pct/100)`
  - Remover o campo `base_value` do input (calculado automaticamente)
- **`useProposals.ts`**: Na mutation, `base_value = list_price * (1 - discount_pct/100)` e `final_value = base_value`.

### 4. Cases: Input de tipo como multi-select com tags pré-definidas

Substituir o input de texto livre "Tipo de Projeto" por um multi-select com as categorias predefinidas, com opção de adicionar personalizada.

---

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `supabase/migrations/` | Nova migration: adicionar coluna `tags TEXT[]` em `proposal_cases` |
| `src/features/proposals/types/index.ts` | `ProposalCase.tags: string[]`, atualizar `ICON_OPTIONS` com mapa de componentes |
| `src/features/proposals/components/ProposalWizard.tsx` | Thumb nos cases, ícones visuais nos entregáveis, lógica de investimento corrigida, multi-select de tags |
| `src/features/proposals/hooks/useProposalCases.ts` | Suportar campo `tags` |
| `src/features/proposals/hooks/useProposals.ts` | Calcular `base_value` a partir de `list_price - desconto` |

