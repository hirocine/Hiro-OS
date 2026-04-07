

# Update priority filter chips and PipelineProgress

## 2 files

### 1. `src/pages/PostProduction.tsx`
Replace the priority filter chips to use colored backgrounds from `PP_PRIORITY_CONFIG` (`.bgColor`, `.color`) instead of generic foreground/background. Active state adds `ring-2 ring-offset-1 ring-current border-transparent`; inactive uses `opacity-60 hover:opacity-100`. Add `font-medium` to all chips.

### 2. `src/features/post-production/components/PPTable.tsx`
Replace `PipelineProgress` component: add `leading-none` to the status label, change gap between progress segments from `gap-0.5` to `gap-[3px]`, use `_` instead of `step` in the map since it's unused, add `w-full` to the segments container, and keep `transition-colors` instead of `transition-all`.

No logic changes. No other files.

