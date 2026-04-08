

# Fase 3 — TaskCalendarView (Calendar View)

## Files

### 1. CREATE `src/features/tasks/components/TaskCalendarView.tsx`
Full calendar component with 3 sub-views (Month/Week/List), following RecordingsCalendar visual patterns:

- **State**: `view` (month/week/list), `currentDate`, `animKey`
- **Data**: Filter active tasks with due dates, group by date via `Map<string, Task[]>`
- **Navigation**: Period label, prev/next buttons, view toggle pills
- **Month view**: 7-col grid with weekday headers, day cells showing priority-colored pills (max 2 + overflow), today circle highlight, filler days empty
- **Week view**: 7 horizontal day cards with left-border colored by priority, task title + first assignee name
- **List view**: Tasks grouped into Atrasadas/Esta semana/Próxima semana/Este mês/Futuras, each with date box, priority badge, status badge, assignee info
- **Priority pill colors**: urgente=red, alta=orange, media=yellow, baixa=blue, standby=gray (with dark mode variants)
- Click any task → `navigate('/tarefas/{id}')`

### 2. MODIFY `src/features/tasks/components/index.ts`
- Remove: `export * from './TaskCalendarWidget';`
- Add: `export * from './TaskCalendarView';`

### 3. MODIFY `src/pages/Tasks.tsx`
- Add import: `TaskCalendarView`
- Replace calendar placeholder (lines 249-254) with: `<TaskCalendarView tasks={filteredTasks} isLoading={isLoading} />`

### 4. DELETE `src/features/tasks/components/TaskCalendarWidget.tsx`

No other files modified. No changes to `src/features/proposals/components/public/`.

