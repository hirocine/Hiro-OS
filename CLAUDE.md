# Hiro OS — Project Context

## DS migration scope

The Hiro OS internal admin interface uses the new design system (`--ds-*` tokens, hairline borders, squared corners, HN Display + HN Text fonts, tabular nums for numbers/dates).

## DO NOT TOUCH unless explicitly requested

- **`src/features/proposals/components/public/*`** — public-facing proposal renderer (customer view). These pages have their own visual language (rounded corners, gradients, custom typography). Do **not** apply the DS migration unless the user explicitly asks.
- **`src/pages/ProjectWithdrawal.tsx`** — fullscreen withdrawal wizard, intentionally skipped from the DS retrofit.

## Skipped — dead code

- `src/components/Equipment/EquipmentFilters.tsx`
- `src/components/Equipment/SavedFilters.tsx`
- `src/components/Equipment/EquipmentHierarchyRow.tsx`

(All three are not imported anywhere in the codebase.)

## Known pre-existing TypeScript issues (not introduced by DS migration)

- `src/components/Equipment/EquipmentDetailsDialog.tsx` references a `loan_history` table that doesn't exist in the Supabase generated types. Unrelated to the visual migration; address separately when the schema is fixed.
