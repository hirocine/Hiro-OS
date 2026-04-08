

# Reestruturar página /tarefas — Fase 1 (Infraestrutura)

## Arquivos modificados (3)

### 1. `src/features/tasks/hooks/useFilteredTaskStats.ts`
- Add `completed` field to `FilteredStats` interface
- Calculate `completed = tasks.filter(t => t.status === 'concluida').length`
- Return `{ active, overdue, urgent, completed }`

### 2. `src/features/tasks/components/TaskSummaryBar.tsx`
- Add `completed` to stats prop type
- Change `grid-cols-3` to `grid-cols-4`
- Add 4th metric: icon `CheckCircle`, color `text-green-600`, bg `bg-green-500/10`, label "Concluídas"

### 3. `src/pages/Tasks.tsx` — full restructure

**New imports:**
- `List, Columns3, CalendarDays, Search` from lucide-react
- `Input` from `@/components/ui/input`
- `Select, SelectTrigger, SelectValue, SelectContent, SelectItem` from `@/components/ui/select`
- `useUsers` from `@/hooks/useUsers`
- `useDepartments` from `@/features/tasks/hooks/useDepartments`
- `PRIORITY_CONFIG, STATUS_CONFIG` from `@/features/tasks/types`
- Remove `TaskCalendarWidget` import

**New state:**
- `currentView`: `'lista' | 'kanban' | 'calendario'` (default `'lista'`)
- `searchQuery`, `filterPriority`, `filterStatus`, `filterDepartment`, `filterAssignee` (all string, default `''` or `'all'`)

**New hooks:**
- `const { users } = useUsers()`
- `const { departments } = useDepartments()`

**`filteredTasks` useMemo** — applies all 5 filters on `tasks` array sequentially (search, priority, status, department, assignee)

**Stats & tab arrays** — all derived from `filteredTasks` instead of `tasks`

**JSX structure:**
1. PageHeader (unchanged)
2. TaskSummaryBar with `completed` stat
3. **Toolbar** (inline div, not separate component):
   - View toggle: 3 styled buttons (Lista/Kanban/Calendário) with active state styling
   - Search Input with Search icon
   - 4 Select dropdowns: Prioridade (from PRIORITY_CONFIG), Status (from STATUS_CONFIG), Departamento (from departments), Responsável (from users)
4. **Conditional content:**
   - `'lista'`: existing Card with Tabs (using filteredTasks-derived arrays)
   - `'kanban'`: placeholder Card with "em breve" message
   - `'calendario'`: placeholder Card with "em breve" message
5. Remove `<TaskCalendarWidget>` from render

