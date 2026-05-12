# Hiro OS — Project Context

## DS migration scope

The Hiro OS internal admin interface uses the new design system (`--ds-*` tokens, hairline borders, squared corners, HN Display + HN Text fonts, tabular nums for numbers/dates).

## DO NOT TOUCH unless explicitly requested

- **`src/features/proposals/components/public/*`** — public-facing proposal renderer (customer view). These pages have their own visual language (rounded corners, gradients, custom typography). Do **not** apply the DS migration unless the user explicitly asks.
- **`src/pages/ProjectWithdrawal.tsx`** — fullscreen withdrawal wizard, intentionally skipped from the DS retrofit.

## Known pre-existing TypeScript issues (not introduced by DS migration)

_None currently. The previous `loan_history` issue was resolved by switching the query in `EquipmentDetailsDialog.tsx` to the existing `loans` table._
