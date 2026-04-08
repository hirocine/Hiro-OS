

# CRM — 5 High-Priority Improvements

## Files to create
1. `src/features/crm/hooks/useTeamProfiles.ts`

## Files to modify (11 total)
1. `src/features/crm/types/crm.types.ts` — add `wonRevenue` to CRMStats
2. `src/features/crm/hooks/useCRMStats.ts` — calculate wonRevenue
3. `src/features/crm/hooks/useContacts.ts` — add `assignedTo` filter
4. `src/features/crm/hooks/useDeals.ts` — include `proposal_id` in returned data
5. `src/features/crm/components/CRMDashboard.tsx` — 5th stats card + 3 recharts graphs
6. `src/features/crm/components/pipeline/PipelineBoard.tsx` — search input + assignee filter
7. `src/features/crm/components/pipeline/DealForm.tsx` — proposal + assignee fields
8. `src/features/crm/components/contacts/ContactForm.tsx` — assignee field
9. `src/features/crm/components/contacts/ContactsList.tsx` — assignee filter
10. `src/pages/CRMDealDetail.tsx` — show linked proposal
11. `src/pages/CRMContactDetail.tsx` — badge "Com proposta" on deals

No changes to `src/features/proposals/components/public/`.

---

## 1. Proposal ↔ Deal linking

### 1a. DealForm.tsx
- Add `proposal_id: ''` to `emptyForm`, `assigned_to: ''` too (covers improvement #5d)
- Fetch proposals: `supabase.from('orcamentos').select('id, project_name, client_name, slug, final_value, status').eq('is_latest_version', true).order('created_at', { ascending: false })`
- Add optional Select "Proposta vinculada" after description: options show `{project_name} — {client_name}`, value "none" for no link
- Add optional Select "Responsável" using `useTeamProfiles` (improvement #5d)
- In handleSubmit: `proposal_id: form.proposal_id || null`, `assigned_to: form.assigned_to || null`
- In useEffect for edit: load `deal.proposal_id`, `deal.assigned_to`

### 1b. CRMDealDetail.tsx
- After fetching deal, if `deal.proposal_id` exists, fetch proposal: `supabase.from('orcamentos').select('project_name, slug, final_value, status').eq('id', deal.proposal_id).single()`
- Below contact name in summary card, show linked proposal with FileText icon + link to `/orcamentos/${proposal.slug}`

### 1c. useDeals.ts
- The query already returns `*` which includes `proposal_id` — no change needed to the hook query
- `DealWithRelations` already extends `Deal` which has `proposal_id`

### 1d. CRMContactDetail.tsx
- In deals list, check `d.proposal_id` and show `<Badge variant="outline" className="text-xs">Com proposta</Badge>` next to stage badge

---

## 2. Dashboard Charts (recharts)

### CRMDashboard.tsx
- Import `usePipelineStages`, `useContacts` hooks + recharts components (`BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer as RechContainer, PieChart, Pie, Cell, Legend`)
- Add 3 chart cards between StatsCards and "Atenção Necessária":

**Layout:**
```
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <Card className="lg:col-span-2">  <!-- Funil full-width -->
  <Card>  <!-- Origem dos Leads donut -->
  <Card>  <!-- Receita Fechada por Mês -->
</div>
```

**Funil de Vendas**: Horizontal BarChart, group deals by stage (active only), Y=stage name, X=count, bars colored by stage.color, layout="vertical", height 250

**Origem dos Leads**: PieChart donut (innerRadius=60, outerRadius=90), group contacts by lead_source, show percentages, legend below

**Receita Fechada por Mês**: Vertical BarChart, filter won deals with closed_at, group by month (last 6), X=month name (pt-BR), Y=BRL value, green bars (#22c55e), tooltip with formatBRL

---

## 3. "Receita Fechada" stats card

### crm.types.ts
- Add `wonRevenue: number` to CRMStats interface

### useCRMStats.ts
- Calculate: `const wonRevenue = deals.filter(d => wonIds.has(d.stage_id)).reduce((sum, d) => sum + (d.estimated_value ?? 0), 0)`
- Return in object

### CRMDashboard.tsx
- Change StatsCardGrid to `columns={5}`
- Add 5th card: CircleDollarSign icon, title "Receita Fechada", value `formatBRL(stats?.wonRevenue ?? 0)`, green colors

---

## 4. Pipeline Search

### PipelineBoard.tsx
- Add `search` state + `useDebounce(search, 300)`
- Add Input with Search icon in the summary bar (before deals count)
- Filter deals client-side before `dealsByStage` grouping: match `deal.title` or `deal.contact_name` case-insensitive against debounced search

---

## 5. Assignee Filter

### 5a. Create useTeamProfiles.ts
- Query `profiles` table: `select('user_id, display_name').eq('is_approved', true).order('display_name')`
- Export `TeamProfile` interface + `useTeamProfiles` hook

### 5b. PipelineBoard.tsx
- Add `assigneeFilter` state + Select using `useTeamProfiles`
- Place Select next to search input
- Filter deals client-side: if assigneeFilter set, keep only `deal.assigned_to === assigneeFilter`

### 5c. ContactsList.tsx
- Add `assigneeFilter` state + Select using `useTeamProfiles` in filters row
- Pass `assignedTo` to `useContacts` filters

### 5c'. useContacts.ts
- Add `assignedTo?: string` to ContactFilters
- If set, add `.eq('assigned_to', filters.assignedTo)` to query

### 5d. DealForm.tsx (covered in 1a above)

### 5e. ContactForm.tsx
- Add `assigned_to: ''` to emptyForm
- Add Select "Responsável" using useTeamProfiles
- Include in payload: `assigned_to: form.assigned_to || null`
- Load from contact on edit

