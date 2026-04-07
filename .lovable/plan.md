

# Fix pipeline step alignment in PPVideoPage.tsx

## Single file: `src/features/post-production/components/PPVideoPage.tsx`

### 1. Macro steps — always render both lines (lines 376-389)
Replace the two conditional blocks (`{i > 0 && ...}` and `{i < MACRO_STEPS.length - 1 && ...}`) with always-rendered lines that use `bg-transparent` for the edges:

```tsx
{/* Line left — always present, transparent on first step */}
<div className={cn(
  'absolute left-0 right-1/2 top-[18px] h-px transition-colors duration-300',
  i === 0 ? 'bg-transparent' : (isDone || isActive ? 'bg-primary' : 'bg-border')
)} />
{/* Line right — always present, transparent on last step */}
<div className={cn(
  'absolute left-1/2 right-0 top-[18px] h-px transition-colors duration-300',
  i === MACRO_STEPS.length - 1 ? 'bg-transparent' : (isDone ? 'bg-primary' : 'bg-border')
)} />
```

### 2. Sub-steps — same pattern (lines 428-439)
Replace the two conditional blocks with always-rendered lines:

```tsx
{/* Line left — always present, transparent on first step */}
<div className={cn(
  'absolute left-0 right-1/2 top-[11px] h-px transition-colors duration-200',
  i === 0 ? 'bg-transparent' : (isDone || isActive ? 'bg-primary/60' : 'bg-border')
)} />
{/* Line right — always present, transparent on last step */}
<div className={cn(
  'absolute left-1/2 right-0 top-[11px] h-px transition-colors duration-200',
  i === SUB_STEPS[form.status].length - 1 ? 'bg-transparent' : (isDone ? 'bg-primary/60' : 'bg-border')
)} />
```

No logic changes. No other files.

