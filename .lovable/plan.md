

# Fix dropdown menu item visual inconsistencies

## Changes in `src/components/ui/dropdown-menu.tsx`

### 1. DropdownMenuCheckboxItem
- Replace className with the standard item style: `rounded-lg px-2 py-2 min-h-[36px] gap-2 focus:bg-muted/70 focus:text-foreground transition-colors`
- Remove `absolute left-2` wrapper span — move `ItemIndicator` (Check icon) after `{children}` with `ml-auto`

### 2. DropdownMenuRadioItem
- Same className update as CheckboxItem
- Move `ItemIndicator` (Circle icon) after `{children}` with `ml-auto`

### 3. DropdownMenuLabel
- Remove `inset && "pl-8"` — keep `px-2 py-1.5` (already correct, just remove the inset override)

### 4. DropdownMenuItem
- Add `data-[state=checked]:font-medium` to existing className

No other files changed.

