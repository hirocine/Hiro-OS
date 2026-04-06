

# Refine dropdown, select, and popover visuals

Update classNames in 3 UI component files for a cleaner, more refined look — rounder corners (`rounded-xl`/`rounded-lg`), subtler borders (`border-border/60`), better shadows (`shadow-lg`), tighter padding, and muted hover states (`focus:bg-muted/70`).

## 1. `src/components/ui/select.tsx`
- **SelectTrigger**: `h-9`, `rounded-lg`, add `focus:ring-1 focus:ring-primary/20 focus:border-primary/40`, add `transition-colors`
- **SelectContent**: `rounded-xl`, `border-border/60`, `shadow-lg`, `p-1`
- **SelectItem**: `rounded-lg`, `focus:bg-muted/70 focus:text-foreground`, add `transition-colors`, remove min-height

## 2. `src/components/ui/dropdown-menu.tsx`
- **DropdownMenuContent**: `rounded-xl`, `border-border/60`, `shadow-lg`, add entry/exit animations, remove `backdrop-blur-sm`
- **DropdownMenuItem**: `rounded-lg`, `focus:bg-muted/70 focus:text-foreground`, `min-h-[36px]`, `gap-2`
- **DropdownMenuSubTrigger**: `rounded-lg`, `focus:bg-muted/70`, `gap-2`, remove `inset` logic from className

## 3. `src/components/ui/popover.tsx`
- **PopoverContent**: `rounded-xl`, `border-border/60`, `shadow-lg`

All changes are className-only replacements. No logic or structure changes.

