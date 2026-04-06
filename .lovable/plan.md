

# Rewrite PPVideoPage layout to match ProposalDetails pattern

## Single file: `src/features/post-production/components/PPVideoPage.tsx`

All existing logic, hooks, state, handlers remain unchanged. Only the JSX layout and imports change.

### Import changes
- Add `ResponsiveContainer` from `@/components/ui/responsive-container`
- Add `Save`, `Clapperboard`, `Info`, `MessageSquare` from `lucide-react`
- Remove `Separator` import (no longer used in section headers)

### 1. Root wrapper
Replace `<div className="space-y-6 p-6 max-w-7xl mx-auto">` with:
```tsx
<ResponsiveContainer maxWidth="7xl">
  <div className="animate-fade-in space-y-6">
```

### 2. Header — non-sticky, matching ProposalDetails
Replace the sticky header with a simple flex row:
- Left: ghost back button + title (`text-lg font-semibold`) + subtitle (client/project/date)
- Right: Destructive delete button + Save button (with `<Save>` icon)
- No `sticky`, no `backdrop-blur`, no negative margins

### 3. Summary Card (new, after header)
A `<Card>` with `<CardContent className="p-5">` containing:
- Left: composed title as `h1 text-xl font-semibold`, latest version badge if exists
- Below title: `text-sm text-muted-foreground` with client/project info
- Right: status + priority badges

### 4. Pipeline Card — section header pattern
Replace `<CardHeader>` with the ProposalDetails border-b header:
```tsx
<div className="flex items-center px-6 py-4 border-b border-border">
  <div className="flex items-center gap-3">
    <div className="p-1.5 rounded-md bg-muted">
      <Clapperboard className="h-4 w-4 text-foreground/70" />
    </div>
    <CardTitle className="text-sm font-semibold tracking-tight">Pipeline de Produção</CardTitle>
  </div>
</div>
```
Pipeline content moves to `<CardContent className="pt-6 space-y-5">`.

### 5. Two-column grid — section header pattern for both cards
- **Dados do Vídeo** card: same border-b header with `FileText` icon
- **Informações** card: same border-b header with `Info` icon
- Both use `<CardContent className="pt-6 space-y-4">`
- Each field wrapped in `<div className="space-y-1.5">`

### 6. Atividade & Versões — full width, below grid
Same border-b header with `MessageSquare` icon and "Adicionar versão" button on the right. Content in `<CardContent className="pt-6 space-y-4">`.

### Technical notes
- `FileText` is already available in lucide-react
- The `DateField` helper and all handlers remain identical
- Closing tags: `</div></ResponsiveContainer>` at the end

