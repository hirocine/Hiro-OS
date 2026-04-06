

# Redesign PPVideoPage layout

## Single file: `src/features/post-production/components/PPVideoPage.tsx`

### 1. Root padding (line 215)
Change `<div className="space-y-6">` to `<div className="space-y-6 p-6 max-w-7xl mx-auto">`

### 2. Sticky header (lines 217-246)
Replace the current header with a sticky bar: `sticky top-0 z-10 -mx-6 -mt-6 px-6 py-4 bg-background/95 backdrop-blur border-b flex items-center justify-between gap-4 mb-2`. Title becomes `text-lg`, subtitle becomes `text-xs`.

### 3. Pipeline steps full width (lines 255-293)
- Outer div: `flex items-center gap-0` → `flex items-center w-full`
- Each step wrapper: add `flex-1 flex flex-col items-center`
- Circle: `w-8 h-8` → `w-10 h-10`, text `text-xs` → `text-sm`
- Step label: `text-[11px]` → `text-xs`
- Connector: `w-8 mx-1` → `flex-1 mx-2`

### 4. All Labels — add `block mb-1.5`
Every `<Label className="text-xs">` and `<Label className="text-xs text-muted-foreground">` gets `block mb-1.5` added. Also applies to the DateField helper's Label.

### 5. Move "Atividade & Versões" to full width
- Remove the Atividade card (lines 394-490) from inside the left column `lg:col-span-2`
- Place it after the closing `</div>` of the grid as a standalone full-width `<Card>`
- Left column only keeps "Dados do Vídeo"

No logic changes. No other files.

