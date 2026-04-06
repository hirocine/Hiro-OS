

# Fix and improve RecordingsCalendar — 5 changes

## Changes in `src/components/Home/RecordingsCalendar.tsx`

### 1. Fix timeMin for month view (line 80)
Change `startOfWeek(startOfMonth(currentDate))` to `startOfMonth(currentDate)` so events from previous month filler days aren't fetched. Filler cells will render empty.

### 2. Icon color (line 131-132)
Replace `bg-green-500/10` with `bg-destructive/10` and `text-green-500` with `text-destructive`.

### 3. Colored event pills in month view (lines 200-212)
Remove the dot element. Replace the pill className with type-specific colored backgrounds using a `PILL_COLORS` map:
- REC: `bg-destructive/15 text-destructive font-medium`
- PRE: `bg-muted text-muted-foreground`
- VT: `bg-warning/15 text-warning font-medium`
- EDIT: `bg-secondary text-secondary-foreground`
- OTHER: `bg-muted text-muted-foreground`

Each pill: `text-[10px] px-1.5 py-0.5 rounded truncate w-full cursor-pointer`

### 4. Day cell borders (lines 191-195)
Replace current className with: `min-h-[80px] p-1.5 border border-border/50 transition-colors hover:bg-muted/30 cursor-pointer` + today ring + other-month `opacity-30 bg-muted/20`.

### 5. Event detail popover
- Add imports: `X, Calendar, MapPin, FileText` from lucide-react
- Add state: `selectedEvent`
- Create `EventDetailPopover` internal component with overlay modal showing: color bar top, type badge, title, date/time, location, description, Google Calendar link
- Wire `onClick={() => setSelectedEvent(event)}` on all event pills (month), cards (week), and rows (list)
- Render `{selectedEvent && <EventDetailPopover ... />}` before closing `</CardContent>`
- Remove the `window.open` from list view click (replaced by popover)
- Remove `DOT_COLORS` constant (no longer used)

