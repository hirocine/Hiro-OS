

# Add weather and next recording overlay to HeroBanner

## Changes in `src/components/Home/HeroBanner.tsx`

### 1. Imports (lines 1-8)
Add:
```tsx
import { useQuery } from '@tanstack/react-query';
import { useRecordingsCalendar, getEventTitle } from '@/hooks/useRecordingsCalendar';
import { parseISO, differenceInDays, differenceInHours } from 'date-fns';
```

### 2. Hooks (after line 17)
Add weather query (Open-Meteo, Barueri coords), recordings query (next 365 days), and `nextRec` derived value.

### 3. Helper functions (after `getScale`)
Add `getWeatherIcon(code)` and `getCountdown(dateStr)` inside the component.

### 4. Overlay JSX (after line 107, inside the Content div)
Add a bottom-aligned row with:
- **Next recording**: camera emoji + "Próxima gravação" label + event title (truncated) + countdown
- **Weather**: current temp + icon + "Barueri" label, separator, tomorrow forecast with precipitation %

The overlay uses `flex items-end` positioning, white/translucent text with `backdrop-blur` pills, and `text-xs`/`text-sm` sizing. Only renders when data is available.

### Technical detail
- Content div changes from `justify-center` to `justify-between` to push the greeting up and info bar down
- Weather data cached 30min, recordings use existing hook
- No other files changed

