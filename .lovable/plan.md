

# Create RecordingsCalendar component and add to Home page

## New file: `src/components/Home/RecordingsCalendar.tsx`

Full calendar component with 3 views (Mês, Semana, Todos) reading from `useRecordingsCalendar`.

### Structure

**State**: `view` (month/week/list), `currentDate` (Date for navigation)

**Date ranges per view**:
- Month: `startOfMonth` to `endOfMonth`
- Week: `startOfWeek` to `endOfWeek` (weekStartsOn: 0)
- List: today to +60 days

**TYPE_CONFIG** map for badge styling per event type (REC/PRE/VT/EDIT/OTHER) with dot colors.

**Helper**: `getEventsForDay(day, events)` — checks if day falls between event start/end, handling both all-day (date strings) and timed events.

### Card layout
- Header: Video icon (green bg) + "Agenda de Gravações" title + event count + period label
- Navigation: chevron left/right + period label centered
- View switcher: 3 buttons (Mês/Semana/Todos) in muted rounded container

### Month view
- 7-column grid with Dom-Sáb header
- Day cells: min-h-[80px], today gets `ring-1 ring-primary bg-primary/5`, other-month days `opacity-40`
- Events as small pills with colored dot + truncated title, max 2 visible + "+N mais"

### Week view
- 7-column header with day name + number, today column highlighted
- Stacked event cards with `border-l-2` colored by type, title + time info

### List view
- Events grouped by "Esta semana", "Próxima semana", "Este mês", "Próximos meses"
- Each row: date block (big day number + month abbrev) + divider + title/meta + type badge
- Click opens Google Calendar

### Footer
Link to Google Calendar with ExternalLink icon

## Update: `src/pages/Home.tsx`

- Import `RecordingsCalendar`
- Add `<RecordingsCalendar />` between `<TodayWidgets />` and `<TeamDirectory />`
- Add `<div className="h-[500px] bg-muted rounded-lg animate-pulse" />` to loading skeleton between widgets and team skeletons

