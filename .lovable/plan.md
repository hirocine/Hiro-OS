

## Plano aprovado — execução

Sim, o `pendingFocusSub` é exatamente isso: marca a subcategoria onde acabamos de adicionar item, e o `ServiceItemRow` da última posição (com `isCustom && label === ''`) recebe `autoFocusLabel` para focar o input de label automaticamente. Mantido.

### Execução

1. Reescrever `src/features/proposals/components/admin/ServiceItemRow.tsx` com CSS Grid `grid-cols-[32px_200px_1fr_70px_32px]`, divisórias `border-l border-border/50` em cada célula, inputs `bg-transparent` ocupando `w-full` da célula, qtd com borda própria estilo campo numérico.
2. Reescrever `src/features/proposals/components/admin/PhaseCard.tsx`:
   - Card externo: `rounded-xl border border-border bg-card overflow-hidden`.
   - Header de coluna: mesmo `ROW_GRID`, `bg-muted/30`, `border-b border-border`, `border-l border-border` por célula.
   - Label de subcategoria: `px-3 py-2 bg-muted/20 border-b border-border/50 text-[11px] font-medium text-muted-foreground` (sem uppercase).
   - Última row de cada subcategoria sem `border-b` (via `last:border-b-0`).
   - Footer "+ Adicionar item": `p-3 bg-muted/20 border-t border-border` com botão tracejado.
3. Manter intactos: Switch da fase, DropdownMenu de ações, colapso framer-motion, `pendingFocusSub` + autofocus.

### Validação

- `npx tsc --noEmit`
- `npm test` (services-mutations não muda)
- Login + navegar para `/orcamentos/548-grupo-primo-evento-portfel-connect-v1`
- Screenshot da Pré-produção completa
- Screenshot da Gravação com subcategorias Equipe + Equipamentos visíveis
- Inspeção visual antes de entregar: alinhamento de colunas, divisórias visíveis, inputs com affordance, altura ~40px por row. Se algo divergir, aviso antes.

### Entrega

Patch dos 2 arquivos + saída do tsc/testes + 2 screenshots + checklist visual confirmado.

