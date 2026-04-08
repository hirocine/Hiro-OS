

# CRM Module — Phase 1 (revised)

## Corrections applied

1. **Sidebar**: CRM item added to the main `navigation` array (before Fornecedores position) in `DesktopSidebar.tsx`, `MobileSidebar.tsx`, AND `Sidebar.tsx` — not in `producaoNavigation`.
2. **Dashboard cards**: `CRMDashboard.tsx` included in Phase 1 with 4 StatsCards (Total Contatos, Deals Ativos, Valor Pipeline, Taxa de Conversão). Charts deferred to Phase 2.
3. **Contact detail**: "Deals Vinculados" section gets "+ Novo Deal" button in header; clicking it opens DealForm with `contact_id` pre-filled.
4. **DealCard days calculation**: Uses `updated_at` (not `created_at`) for days-in-stage. Orange border when > 7 days.
5. **Lost reason dialog**: Drop onto "Perdido" stage is optimistic-blocked — shows LostReasonDialog first. If user cancels, deal reverts to original position. Only confirmed after reason is submitted.

---

## Files to create (~20 files)

**Types & barrel:**
- `src/features/crm/types/crm.types.ts` — interfaces for Contact, Deal, PipelineStage, Activity, CRMStats; enums for ContactType, LeadSource, ActivityType, ServiceType
- `src/features/crm/index.ts`

**Hooks:**
- `src/features/crm/hooks/useContacts.ts` — list (with search/type/source filters), create, update, delete
- `src/features/crm/hooks/useDeals.ts` — list with joins (contact name, stage), create, update, delete, `moveToStage` mutation
- `src/features/crm/hooks/usePipelineStages.ts` — list ordered by position
- `src/features/crm/hooks/useActivities.ts` — list (filterable by contact/deal, pending vs completed), create, update, toggle complete
- `src/features/crm/hooks/useCRMStats.ts` — aggregates: total contacts, active deals, pipeline value (sum of estimated_value where not won/lost), conversion rate (won / (won+lost))

**Components:**
- `src/features/crm/components/CRMLayout.tsx` — Tabs: Pipeline | Contatos | Atividades | Dashboard
- `src/features/crm/components/CRMDashboard.tsx` — 4x StatsCard grid using `useCRMStats` (reuses `StatsCardGrid` from `@/components/ui/stats-card`)
- `src/features/crm/components/contacts/ContactsList.tsx` — table with search, type filter, source filter
- `src/features/crm/components/contacts/ContactForm.tsx` — dialog create/edit
- `src/features/crm/components/contacts/ContactCard.tsx` — summary card for detail page
- `src/features/crm/components/pipeline/PipelineBoard.tsx` — Kanban with @dnd-kit; summary bar (active deals, pipeline value, stale count)
- `src/features/crm/components/pipeline/PipelineColumn.tsx` — column header with name, color dot, count, total value
- `src/features/crm/components/pipeline/DealCard.tsx` — title, contact name, value (BRL), days in stage (`Math.floor((now - updated_at) / 86400000)`), orange `border-orange-400` when > 7
- `src/features/crm/components/pipeline/DealForm.tsx` — dialog create/edit; accepts optional `defaultContactId` prop
- `src/features/crm/components/pipeline/LostReasonDialog.tsx` — modal with textarea for `lost_reason`; onConfirm completes the stage move, onCancel reverts
- `src/features/crm/components/activities/ActivityForm.tsx` — dialog to register activity
- `src/features/crm/components/activities/ActivityItem.tsx` — single timeline item
- `src/features/crm/components/activities/ActivitiesList.tsx` — Pendentes / Historico sub-tabs

**Pages:**
- `src/pages/CRM.tsx` — renders CRMLayout
- `src/pages/CRMContactDetail.tsx` — BreadcrumbNav, ContactCard, Deals section (with "+ Novo Deal" in section header, pre-selects contact), Activities timeline
- `src/pages/CRMDealDetail.tsx` — BreadcrumbNav, deal summary card, pipeline stage stepper, activities

## Files to modify

- **`src/App.tsx`** — 3 lazy routes: `/crm`, `/crm/contatos/:id`, `/crm/deals/:id`
- **`src/components/Layout/DesktopSidebar.tsx`** — add `{ name: 'CRM', href: '/crm', icon: Users }` to `navigation` array after Plataformas (line 32)
- **`src/components/Layout/MobileSidebar.tsx`** — same addition to `navigation` array (line 34)
- **`src/components/Layout/Sidebar.tsx`** — add to `navigation` array before Fornecedores section

## Dependencies
- `@dnd-kit/core` and `@dnd-kit/sortable` (already used by PPKanban)

## Pipeline drag-and-drop: Lost stage handling

```text
User drags deal → drops on "Perdido" column
  → handleDragEnd detects target stage has is_lost=true
  → sets pendingLostDeal = { dealId, stageId }
  → opens LostReasonDialog
    → User fills reason → confirm
      → mutation: update deal stage_id + lost_reason + closed_at
      → invalidate cache
    → User cancels
      → pendingLostDeal = null (card stays in original column)
```

For `is_won` stages: move sets `closed_at = new Date().toISOString()` automatically, no dialog needed.

## Design patterns (matching codebase)
- BreadcrumbNav for headers
- Section cards with border-b header (icon + title left, action right)
- StatsCard/StatsCardGrid from `@/components/ui/stats-card`
- All labels in Portuguese, BRL formatting
- React Query with cache invalidation on `['crm-*']` keys

