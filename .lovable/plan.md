

# Fix: flickering ao alterar data no calendário do PPDialog

## Problema
Na primeira seleção de data, funciona bem. Mas ao clicar para alterar a data (quando já existe uma data selecionada), o calendário pisca — fecha e reabre rapidamente.

## Causa raiz
Quando o usuário clica no trigger para reabrir o calendário e já existe uma data, o `onSelect` do Calendar dispara imediatamente ao clicar em qualquer dia (incluindo o dia já selecionado durante navegação). O problema é que `setForm` atualiza o estado, causando re-render, e o `setStartDateOpen(false)` fecha o popover — mas o `onOpenChange` do Popover pode reabri-lo no mesmo ciclo porque o clique no trigger ainda está propagando.

A solução real: o `onSelect` não deve fechar o popover se a data selecionada é a mesma que já está no form (o usuário está apenas navegando pelo calendário). E ao fechar, precisamos usar `setTimeout` para garantir que o estado de fechamento não conflite com o evento de clique do trigger.

## Solução

### File: `src/features/post-production/components/PPDialog.tsx`

**Ambos os calendários** — atualizar o `onSelect` para usar `setTimeout` no fechamento, evitando conflito com o ciclo de eventos do Radix:

```tsx
// Início
onSelect={(date) => {
  setForm(prev => ({ ...prev, start_date: date ? format(date, 'yyyy-MM-dd') : '' }));
  setTimeout(() => setStartDateOpen(false), 0);
}}

// Data de Entrega
onSelect={(date) => {
  setForm(prev => ({ ...prev, due_date: date ? format(date, 'yyyy-MM-dd') : '' }));
  setTimeout(() => setDueDateOpen(false), 0);
}}
```

Isso empurra o fechamento para o próximo tick, depois que o evento de clique do Radix Popover termina de propagar, eliminando o conflito entre `onSelect` e `onOpenChange`.

Nenhuma outra alteração. Nenhum outro arquivo.

