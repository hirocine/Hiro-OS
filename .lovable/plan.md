

# Trocar inputs de data nativos por Datepicker Shadcn no PPDialog

## Problema
O dialog usa `<Input type="date">` nativo (feio, inconsistente entre browsers). O projeto já tem o componente `Calendar` do Shadcn com `Popover` usado em outros lugares (ex: `EditProjectDialog`).

## Alteração em `src/features/post-production/components/PPDialog.tsx`

- Importar `Calendar`, `Popover`, `PopoverContent`, `PopoverTrigger`, `CalendarIcon`, `format` (date-fns), `cn`
- Substituir os dois `<Input type="date">` (Prazo e Início, linhas ~215-222) por Popovers com Calendar
- Cada campo: botão trigger mostrando data formatada `dd/MM/yyyy` ou placeholder, popover com `Calendar mode="single"` e `pointer-events-auto`
- Adicionar botão "Limpar" opcional dentro do popover para permitir remover a data
- Converter entre string ISO (`form.due_date`) e `Date` object para o Calendar

