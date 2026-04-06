

# Add htmlLink to recordings events

## 1. Edge function (`supabase/functions/get-recordings/index.ts`)
Add `htmlLink: e.htmlLink || null` to the events mapping object.

## 2. Hook (`src/hooks/useRecordingsCalendar.ts`)
Add `htmlLink: string | null` to the `RecordingEvent` interface.

## 3. Calendar component (`src/components/Home/RecordingsCalendar.tsx`)
Line 141: Replace `href="https://calendar.google.com"` with `href={event.htmlLink || "https://calendar.google.com"}` in the EventDetailPopover footer link.

