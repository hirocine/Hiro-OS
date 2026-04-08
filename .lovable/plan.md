

# Visual Pattern Corrections for CRM Module

5 files to update, matching Proposals page patterns (PageHeader + ResponsiveContainer for lists, BreadcrumbNav + flat section headers for detail pages).

---

## 1. `src/pages/CRM.tsx`
- Replace `BreadcrumbNav` with `PageHeader` (title="CRM", subtitle="Gerencie seu pipeline e contatos comerciais")
- Wrap everything in `ResponsiveContainer maxWidth="7xl"`

## 2. `src/pages/CRMContactDetail.tsx`
- Wrap in `ResponsiveContainer maxWidth="7xl"`
- Rewrite `ContactCard` inline as a rich summary card: Avatar circle with initials (large, colored), name as h2, position + company below, type badge, clickable links (`mailto:`, `tel:`, `https://wa.me/`, Instagram URL)
- Replace CardHeader/CardTitle in Deals section with flat section header pattern:
  ```
  <div className="flex items-center justify-between border-b pb-3 mb-4">
    <div className="flex items-center gap-2 text-sm font-medium">
      <Handshake className="h-4 w-4" /> Deals Vinculados
    </div>
    <Button ...>+ Novo Deal</Button>
  </div>
  ```
- Same flat header for Activities section (icon Activity + "Atividades"), full-width at bottom
- Remove `<Card>` wrapper from both sections, use the Card but with the flat header replacing CardHeader/CardTitle

## 3. `src/pages/CRMDealDetail.tsx`
- Wrap in `ResponsiveContainer maxWidth="7xl"`
- Summary card: title as h2 font-semibold, Badge with stage color, value in text-2xl, contact name as clickable link to `/crm/contatos/:id`, service type, days in stage calculation shown
- Replace CardHeader/CardTitle with flat section header pattern for details and activities sections
- Pipeline stepper: replace simple rounded divs with a horizontal stepper using circles connected by lines. Each circle filled with stage color if past/current, muted if future. Current stage has ring highlight.

## 4. `src/features/crm/components/contacts/ContactsList.tsx`
- Wrap entire content inside a `<Card>` with flat section header (icon Users + "Contatos" left, "Novo Contato" button right, `border-b pb-3 mb-4`)
- Move filters below the header, inside CardContent
- Remove the standalone button from the filters row (it moves to the section header)

## 5. `src/features/crm/components/CRMDashboard.tsx`
- Keep existing 4 StatsCards
- Add "Atencao Necessaria" section below: a Card with flat section header (`AlertTriangle` icon + "Atencao Necessaria")
- Query stale deals (active deals where `updated_at` is older than 7 days) from existing `useDeals()` data
- Query overdue follow-ups using `useActivities({ pending: true })` filtered by `scheduled_at < now`
- If both lists empty, show `EmptyState compact` with "Tudo em dia! Nenhuma pendencia."
- List items: deal name + days stale, or activity description + how overdue

---

## Section header pattern (applied everywhere)
```tsx
<div className="flex items-center justify-between border-b pb-3 mb-4">
  <div className="flex items-center gap-2 text-sm font-medium">
    <Icon className="h-4 w-4" />
    Section Title
  </div>
  {action && <Button ...>Action</Button>}
</div>
```

No changes to `src/features/proposals/components/public/` or any other files.

