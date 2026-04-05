

# Polimento Visual — ProposalGuidedWizard (13 itens)

## Files to modify

1. **`src/index.css`** — add `.scrollbar-thin` utility
2. **`src/features/proposals/types/index.ts`** — export `DOR_EMOJI_OPTIONS` array
3. **`src/pages/ProposalDetails.tsx`** — import `DOR_EMOJI_OPTIONS` from types instead of local const
4. **`src/features/proposals/components/ProposalGuidedWizard.tsx`** — all 13 visual improvements

No files in `src/features/proposals/components/public/` will be touched.

---

## Detailed changes

### `src/index.css` — scrollbar utility (item 13)

Add at the end:
```css
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.15) transparent;
}
.scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
.scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
```

### `src/features/proposals/types/index.ts`

Export `DOR_EMOJI_OPTIONS` array (copy from ProposalDetails.tsx lines 39-87) at the end of the file.

### `src/pages/ProposalDetails.tsx`

Replace local `DOR_EMOJI_OPTIONS` const (lines 39-87) with import from `../features/proposals/types`.

### `src/features/proposals/components/ProposalGuidedWizard.tsx`

**New imports**: `Paperclip` from lucide-react; `DOR_EMOJI_OPTIONS` from types; `Skeleton` from ui/skeleton; `{ createTestimonial }` destructured from `useTestimonials()`.

**New state** (after existing state):
- `showNewTestimonialDialog: boolean` (false)
- `newTestimonial: { name, role, text, image }` (empty strings)
- `paymentPreset: string` ('50_50')

**Constants**:
```ts
const PAYMENT_PRESETS = [
  { value: '50_50', label: '50% + 50%', text: '50% no fechamento do projeto mediante contrato e os outros 50% na entrega do material final' },
  { value: '100_antecipado', label: '100% antecipado', text: '100% antecipado com 5% de desconto sobre o valor final' },
  { value: '3x', label: '3x iguais', text: '3 parcelas iguais: 1ª no fechamento, 2ª na metade do projeto e 3ª na entrega do material final' },
  { value: 'custom', label: 'Personalizado', text: '' },
];
```

**Item 1 — Padronização**: Already consistent across all steps. No changes needed.

**Item 2 — Step 0 Briefing redesign** (lines 479-534):
- Wrap textarea in a `relative` container with `rounded-xl border border-border bg-background p-1`
- Textarea gets `border-0 focus-visible:ring-0 min-h-[280px] scrollbar-thin resize-none`, enhanced placeholder
- Buttons placed `absolute bottom-3 right-3` inside container: PDF upload (Paperclip icon, hidden file input) + Analyze button
- PDF upload: hidden `<input type="file" accept=".pdf,.txt">`, on change read with FileReader as text and append to textarea
- Loading: replace spinner with 4 skeleton cards (`h-14 rounded-lg animate-pulse`) + rotating text below

**Item 3 — Questions animation** (lines 560-564):
- Change `animationFillMode` from `'backwards'` to `'forwards'`
- Add `opacity: 0` as initial inline style
- Add fade-in to summary header div

**Item 4 — Loading post-questions** (lines 540-546):
- Replace simple spinner with skeleton cards (same pattern as item 2)

**Item 5 — Stepper** (lines 451-474):
- Replace `overflow-x-auto pb-2` with `overflow-hidden`
- Add `style={{ scrollbarWidth: 'none' }}`
- Already has `hidden sm:inline` for labels — correct

**Item 6 — Objetivo textarea scrollbar** (line 727):
- Add `scrollbar-thin` class to Textarea

**Item 7 — Dores emoji picker** (lines 770-774):
- Replace static `<span>{dor.label}</span>` with a `Popover` + grid of emojis from `DOR_EMOJI_OPTIONS`
- 6-column grid, on select update `dor.label`

**Item 8 — Portfólio thumbnail fallback** (lines 845-855):
- Add `onError` with two-stage fallback: first try vimeocdn, then hide img and show placeholder

**Item 9 — Entregáveis icon trigger** (line 964):
- Change `w-16` to `w-20`, add `text-lg` to ensure emoji renders

**Item 10 — Depoimento: criar novo** (after line 1159):
- Add `<Button variant="outline">+ Criar novo depoimento</Button>`
- Dialog with name, role, text, image URL fields
- On create: call `createTestimonial.mutateAsync(...)`, auto-select, close

**Item 11 — Payment presets** (lines 1217-1219):
- Add `<Select>` with `PAYMENT_PRESETS` above the textarea
- On select preset: fill `paymentTerms`, set textarea `readOnly` (unless 'custom')

**Item 12 — Revisão dores layout** (lines 1270-1275):
- Change `flex gap-1` to `flex flex-wrap gap-2` and add `whitespace-nowrap` to badges

**Item 13 — Scrollbar**: Apply `scrollbar-thin` class to all Textareas and scrollable areas (bank of dores `max-h-60 overflow-y-auto`, etc.)

