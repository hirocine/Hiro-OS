

# Fix: calendário infinito ao selecionar data no PPDialog

## Problema
Ao selecionar uma data no calendário dentro do Dialog, o Popover não fecha automaticamente. Cada clique em uma data mantém o popover aberto e pode causar comportamento estranho de "calendário infinito".

## Causa
O `<Popover>` não é controlado — não tem estado `open`/`onOpenChange`. Quando `modal={false}`, o popover não fecha automaticamente ao selecionar uma data no `Calendar`.

## Solução

### File: `src/features/post-production/components/PPDialog.tsx`

1. **Adicionar dois estados de controle** para os popovers:
```tsx
const [startDateOpen, setStartDateOpen] = useState(false);
const [dueDateOpen, setDueDateOpen] = useState(false);
```

2. **Tornar ambos Popovers controlados** — adicionar `open` e `onOpenChange`:
```tsx
<Popover modal={false} open={startDateOpen} onOpenChange={setStartDateOpen}>
```
```tsx
<Popover modal={false} open={dueDateOpen} onOpenChange={setDueDateOpen}>
```

3. **Fechar o popover ao selecionar data** — nos callbacks `onSelect` de cada Calendar, adicionar o fechamento:
```tsx
onSelect={(date) => {
  setForm(prev => ({ ...prev, start_date: date ? format(date, 'yyyy-MM-dd') : '' }));
  setStartDateOpen(false);  // ← fecha o popover
}}
```
```tsx
onSelect={(date) => {
  setForm(prev => ({ ...prev, due_date: date ? format(date, 'yyyy-MM-dd') : '' }));
  setDueDateOpen(false);  // ← fecha o popover
}}
```

4. **Remover `initialFocus`** dos dois `<Calendar>` — essa prop pode conflitar com `modal={false}` dentro de um Dialog e contribuir para o bug de foco.

No other files changed.

