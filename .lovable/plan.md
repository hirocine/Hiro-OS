

# Replace recordings data source with useRecordingsToday

## Changes in `src/components/Home/TodayWidgets.tsx`

### 1. Import (line 10)
Replace `import { useProjects } from '@/features/projects/hooks/useProjects'` with:
```tsx
import { useRecordingsToday, getEventTitle } from '@/hooks/useRecordingsCalendar';
```

### 2. Data source (lines 20, 36-37)
Remove `const { projects } = useProjects();` and `const todayRecordings = ...`. Replace with:
```tsx
const { data: recordingEvents = [], isLoading: recordingsLoading } = useRecordingsToday();
```

### 3. Recordings widget (lines 146-170)
- Count: `recordingEvents.length`
- Subtitle: `recordingEvents.length === 1 ? "gravação agendada" : "gravações agendadas"`
- List: map `recordingEvents.slice(0, 3)` showing `getEventTitle(e.summary)` as title, time badge (`e.allDay ? "Dia todo" : new Date(e.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })`)
- Empty text: `recordingsLoading ? "Carregando..." : "Nenhuma gravação hoje"`

