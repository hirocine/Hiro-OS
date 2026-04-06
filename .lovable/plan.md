

# Create TodayWidgets and update Home page

## New file: `src/components/Home/TodayWidgets.tsx`

Three side-by-side cards in a `grid grid-cols-1 md:grid-cols-3 gap-4` layout.

### Data sources
- **Entregas hoje**: `usePostProduction()` from `@/features/post-production/hooks/usePostProduction` -- filter `items` where `item.due_date === today` and `item.status !== 'entregue'`, sort by `PP_PRIORITY_ORDER[priority]` desc
- **Minhas tarefas**: `useTasks()` from `@/features/tasks/hooks/useTasks` -- filter `tasks` where status not in `['concluida','arquivada']` and `assignees?.some(a => a.user_id === user?.id)`. Sort: due_date === today first. Get `user` from `useAuthContext()`
- **Gravacoes do dia**: `useProjects()` from `@/features/projects/hooks/useProjects` -- filter `projects` where `startDate === today` and `status === 'active'`

Today string: `new Date().toLocaleDateString('en-CA')` (YYYY-MM-DD)

### Card design (shared pattern per widget)
- `<Card>` with `hover:shadow-md transition-shadow cursor-pointer group` + `onClick={() => navigate(path)}`
- Header row: icon in colored rounded container (blue/amber/green) + label + `<ArrowRight>` with `opacity-50 group-hover:opacity-100 transition-opacity`
- Big number `text-3xl font-bold` + subtitle `text-sm text-muted-foreground`
- `<Separator />` then up to 3 items: colored dot + truncated title + right-aligned badge (priority for deliveries, date for tasks, first name for recordings)
- Empty: muted text like "Nenhuma entrega para hoje"
- Use `format`, `parseISO` from `date-fns` for date formatting

### Icons
- Deliveries: `Film` (blue)
- Tasks: `CheckSquare` (amber)  
- Recordings: `Video` (green)

## Update: `src/pages/Home.tsx`

1. Remove `AIAssistant` import and usage
2. Add `import TodayWidgets from "@/components/Home/TodayWidgets"`
3. Order: `<HeroBanner />` then `<TodayWidgets />` then `<TeamDirectory />`
4. Loading skeleton: add `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">` with 3 skeleton cards (h-48) between banner and team skeletons

