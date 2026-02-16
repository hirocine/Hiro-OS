

## Substituir "Fluxo de Caixa" por "Gestao de CAPEX (Ativos)"

### Resumo

Remover a sub-rota e pagina de Fluxo de Caixa (`/financeiro/fluxo-de-caixa`) e substituir por uma nova pagina de Gestao de CAPEX (`/financeiro/capex`). A nova pagina segue a identidade visual do Dashboard Financeiro (mesmos componentes `Card`, `CardHeader`, `CardContent`, grid responsivo, icones Lucide, cores semânticas).

Os dados serao mock por enquanto, calculados a partir dos equipamentos existentes na tabela `equipments` (campos `value`, `depreciated_value`, `category`, `purchase_date`).

### Estrutura Visual

**Linha 1 -- Resumo Contabil (3 cards, grid `sm:grid-cols-3`):**

- **Total Investido Patrimonial**: Soma de `value` de todos os equipamentos. Icone: `Landmark`. Cor: `text-foreground`.
- **Total Patrimonial Atual**: Soma de `depreciated_value` (ou `value` se nao houver depreciado). Icone: `TrendingDown`. Cor: `text-primary`.
- **Depreciacao Mensal**: Diferenca (Investido - Atual) / meses desde a compra media, ou um mock fixo. Icone: `ArrowDownRight`. Cor: `text-destructive`.

**Linha 2 -- Segmentacao Estrategica (4 cards, grid `sm:grid-cols-2 lg:grid-cols-4`):**

- **Equipamentos AV**: Soma de valor dos equipamentos nas categorias Camera, Iluminacao (e similares). Icone: `Camera`. Cor: `text-primary`.
- **Tecnologia & Post**: Soma de valor nas categorias Computadores, Armazenamento. Icone: `Monitor`. Cor: `text-primary`.
- **Imobilizado Geral**: Soma de valor nas demais categorias (Grip, Eletrica, Diversos, etc). Icone: `Building2`. Cor: `text-muted-foreground`.
- **CAPEX 2026**: Soma de valor dos equipamentos com `purchase_date` no ano 2026. Icone: `CalendarPlus`. Cor: `text-success`. Card com borda `border-success/30`.

### Detalhes Tecnicos

**Arquivos a criar:**
- `src/data/mockCapexData.ts` -- tipos e dados mock de CAPEX
- `src/hooks/useCapexData.ts` -- hook com useQuery retornando dados mock (preparado para Supabase)
- `src/pages/Capex.tsx` -- pagina com layout identico ao Dashboard (ResponsiveContainer, PageHeader, section headers com icones, cards UnitCard-style)

**Arquivos a editar:**
- `src/App.tsx` -- trocar rota `financeiro/fluxo-de-caixa` por `financeiro/capex`, trocar lazy import de CashFlow por Capex
- `src/components/Layout/DesktopSidebar.tsx` -- trocar item "Fluxo de Caixa" por "Gestao de CAPEX" com href `/financeiro/capex`
- `src/components/Layout/MobileSidebar.tsx` -- mesma troca no menu mobile

**Arquivos a remover (ou deixar orfaos):**
- `src/pages/CashFlow.tsx` -- pagina removida da navegacao (pode ser deletada)
- `src/hooks/useCashFlowData.ts` -- nao mais referenciado (pode ser deletado)
- `src/data/mockCashFlowData.ts` -- nao mais referenciado (pode ser deletado)

**Nota:** A secao "Fluxo de Caixa" que existe DENTRO do Dashboard (`Dashboard.tsx`) permanece inalterada -- so estamos removendo a sub-pagina dedicada.

### Identidade Visual

A pagina segue exatamente o padrao do Dashboard:
- `ResponsiveContainer maxWidth="7xl"`
- `PageHeader` com titulo e subtitulo
- Sections com icone + `h2` como header
- Cards usando `shadow-card hover:shadow-elegant transition-all duration-200 hover:scale-[1.02]`
- Grid responsivo: `grid-cols-1 sm:grid-cols-3` (linha 1) e `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (linha 2)
- Valores com `formatCurrency` e fontes `text-base sm:text-lg lg:text-xl font-bold`

