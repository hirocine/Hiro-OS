
# Fase 2 — TaskKanbanView

## Arquivos

### 1. CRIAR `src/features/tasks/components/TaskKanbanView.tsx`
Kanban board with 4 columns (Pendente, Em Progresso, Concluída, Arquivada). Features:
- Tasks grouped by status via `useMemo`
- Quick-add inline input on each column (especially Pendente)
- Click card to navigate to `/tarefas/{id}`
- Move buttons visible on hover to change status
- Due date display with overdue detection
- Assignee avatars, department badge, priority badge
- Loading skeleton state
- No subtask progress (fields don't exist yet)

### 2. MODIFICAR `src/features/tasks/components/index.ts`
Add `export * from './TaskKanbanView';`

### 3. MODIFICAR `src/pages/Tasks.tsx`
- Import `TaskKanbanView`
- Replace kanban placeholder with `<TaskKanbanView tasks={filteredTasks} isLoading={isLoading} />`

No changes to `src/features/proposals/components/public/`.
