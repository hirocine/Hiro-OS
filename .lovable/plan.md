

# Polish do módulo de Tarefas — 8 ajustes

## Arquivos

### 1. MODIFICAR `src/features/tasks/components/TaskKanbanView.tsx` (5 ajustes)

**A) Grid responsivo** — Lines 98, 111: Replace `grid-cols-4` with `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`

**B) Move buttons mobile** — Line 185: Replace `hidden group-hover:flex` with `flex sm:opacity-0 sm:group-hover:opacity-100 transition-opacity`

**C) Quick-add Card wrapper** — Lines 207, 227: Replace `<div>` / `</div>` with `<Card className="p-3">` / `</Card>`

**D) Priority dot** — Lines 145-148: Replace `<PriorityBadge>` with a colored dot div (`w-2 h-2 rounded-full mt-1.5 shrink-0`). Remove `PriorityBadge` import (line 12) since it's no longer used in this file.

**E) Dark mode column headers** — Lines 23-28: Add `dark:text-*-400` variants to each column's `color` field.

### 2. MODIFICAR `src/features/tasks/components/TaskCalendarView.tsx` (1 ajuste)

**"Hoje" button** — Before line 165 (the left arrow button), add an outline Button "Hoje" that sets `currentDate` to `new Date()` and increments `animKey`.

### 3. MODIFICAR `src/pages/Tasks.tsx` (2 ajustes)

**A) Hide Status filter in lista view** — Wrap the Status Select (lines 151-162) in `{currentView !== 'lista' && (...)}`. Add `useEffect` import and effect to reset `filterStatus` to `'all'` when `currentView` changes to `'lista'`.

**B) Active filters indicator** — After the toolbar div (after line 189), add a conditional div showing "Filtros ativos: mostrando X de Y tarefas" with a "Limpar filtros" ghost button that resets all filter states.

### 4. DELETAR `src/pages/MyTasks.tsx`

File is not referenced in App.tsx routes. Functionality replaced by "Minhas" tab in Tasks.tsx. Safe to delete.

