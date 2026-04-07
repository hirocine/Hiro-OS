

# Rewrite StatsCard and remove borderColor

## 7 files to change

### 1. `src/components/ui/stats-card.tsx`
- Remove `borderColor` from `StatsCardProps` interface
- Remove `borderColor` from destructured props
- Replace Card JSX with the new layout (no `border-l-4`, rounded icon box, `text-3xl` value)

### 2-7. Remove `borderColor` from all consumer files:
- `src/features/post-production/components/PPStatsCards.tsx` — remove 4 `borderColor` entries
- `src/features/tasks/components/TaskStatsCards.tsx` — remove 3 entries
- `src/components/Projects/ProjectStatsCards.tsx` — remove 3 entries
- `src/components/Equipment/EquipmentStatsCards.tsx` — remove 3 entries
- `src/features/audiovisual-projects/components/AVProjectStatsCards.tsx` — remove 3 entries
- `src/pages/SSDs.tsx` — remove 4 entries

No logic changes. `ProjectSummaryCard.tsx` and `ProposalPdfDocument.tsx` use their own local `borderColor` variables unrelated to `StatsCard` — no changes needed there.

