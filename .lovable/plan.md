

# Fix validity_date timezone + add date picker to ProposalDetails

## 1. Fix timezone issue in `useProposals.ts` (line 156)

Replace:
```typescript
validity_date: form.validity_date?.toISOString().split('T')[0],
sent_date: form.sent_date.toISOString().split('T')[0],
```
With:
```typescript
validity_date: form.validity_date ? form.validity_date.toLocaleDateString('en-CA') : undefined,
sent_date: form.sent_date.toLocaleDateString('en-CA'),
```

This prevents UTC conversion from shifting the date back 1 day in Brazilian timezone.

## 2. Add validity_date picker to ProposalDetails.tsx

### State: Expand `clientForm` (line 200)

Add `validity_date: string` to the clientForm state (stored as `'YYYY-MM-DD'` string or `''`).

### Populate (line 214)

Add `validity_date: proposal.validity_date || ''` to the `setClientForm` initialization.

### Dirty check (line 283)

Add `clientForm.validity_date !== (proposal.validity_date || '')` to the `clientDirty` memo.

### Save (line 408)

Add `validity_date: clientForm.validity_date || null` to the `data` object in `saveSection('client')`.

### UI (line 727, after WhatsApp field)

Add a date picker field using Popover + Calendar in the grid:
```
<div className="space-y-1.5">
  <Label className="text-xs">Validade</Label>
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" className="w-full justify-start text-left font-normal">
        <CalendarIcon /> {parsed date or "Selecionar data"}
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <Calendar mode="single" ... pointer-events-auto />
    </PopoverContent>
  </Popover>
</div>
```

Parse `clientForm.validity_date` string to Date for display/selection. On select, convert back with `toLocaleDateString('en-CA')`.

Import `Calendar` from `@/components/ui/calendar`, `CalendarIcon` from lucide (already imported as `Calendar` icon — will use the lucide `CalendarIcon` or rename).

## Files changed

1. `src/features/proposals/hooks/useProposals.ts` — fix timezone
2. `src/pages/ProposalDetails.tsx` — add validity_date field

No files in `src/features/proposals/components/public/` touched.

