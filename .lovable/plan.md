

# Fix Pipeline Section in PPVideoPage

## Single file: `src/features/post-production/components/PPVideoPage.tsx`

### 1. Macro steps container (line 338)
Replace `<div className="flex items-center justify-center gap-0 overflow-x-auto pb-2">` with:
```tsx
<div className="flex items-start w-full">
```

### 2. Macro step buttons (lines 345-358)
Update each `<button>` with `shrink-0`, larger circles (`w-10 h-10`, `text-sm`), `gap-2`, and `duration-300`:
```tsx
<button
  onClick={() => { setForm(prev => ({ ...prev, status: step.key })); setSubStepIndex(0); }}
  className="flex flex-col items-center gap-2 shrink-0 group"
>
  <div className={cn(
    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
    isDone && 'bg-primary text-primary-foreground',
    isActive && 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110',
    !isDone && !isActive && 'bg-muted text-muted-foreground hover:bg-muted/80'
  )}>
    {isDone ? <Check className="h-4 w-4" /> : i + 1}
  </div>
  <span className={cn(
    'text-xs font-medium whitespace-nowrap transition-colors duration-300',
    isActive ? 'text-primary' : 'text-muted-foreground'
  )}>
    {step.label}
  </span>
</button>
```

### 3. Macro step connector (lines 360-362)
Replace fixed-width connector with flex-1, aligned to circle center (`mt-5`):
```tsx
<div className={cn(
  'flex-1 h-0.5 mt-5 rounded-full transition-all duration-500',
  i < currentIdx ? 'bg-primary' : 'bg-border'
)} />
```

### 4. Sub-steps container (line 373)
Replace `<div className="flex items-center gap-0 overflow-x-auto pb-2">` with:
```tsx
<div className="flex items-start w-full flex-wrap gap-y-3">
```

### 5. Sub-step buttons (lines 379-391)
Update to `flex-col` layout with `shrink-0`, `ring-primary/30`, `text-[11px]`:
```tsx
<button onClick={() => handleSubStepClick(i)} className="flex flex-col items-center gap-1.5 shrink-0 group">
  <div className={cn(
    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200',
    isDone && 'bg-primary/80 text-primary-foreground',
    isActive && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
    !isDone && !isActive && 'bg-muted text-muted-foreground'
  )}>
    {isDone ? <Check className="h-3 w-3" /> : i + 1}
  </div>
  <span className={cn(
    'text-[11px] whitespace-nowrap transition-colors',
    isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
  )}>
    {sub}
  </span>
</button>
```

### 6. Sub-step connector (lines 392-394)
Replace with flex-1 + `mt-3` + `min-w-[16px]`:
```tsx
<div className={cn(
  'flex-1 h-0.5 mt-3 rounded-full min-w-[16px] transition-all duration-300',
  i < subStepIndex ? 'bg-primary/50' : 'bg-border'
)} />
```

No logic changes. No other files.

