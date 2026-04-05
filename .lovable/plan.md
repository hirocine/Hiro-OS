
# Refactor internal proposal routes to use slug instead of UUID

## Overview
Replace UUID-based internal routing (`/orcamentos/:id`) with slug-based routing (`/orcamentos/:slug`) across 5 files. Public routes already use slug.

## Changes

### 1. Create `src/features/proposals/hooks/useProposalDetailsBySlug.ts`
Copy of `useProposalDetailsById` but queries `.eq('slug', slug)` instead of `.eq('id', id)`. Query key: `['proposal-by-slug', slug]`.

### 2. Update `src/features/proposals/index.ts`
Add export for `useProposalDetailsBySlug`.

### 3. `src/App.tsx` (2 route changes)
- `orcamentos/:id/overview` → `orcamentos/:slug/overview`
- `orcamentos/:id` → `orcamentos/:slug`

### 4. `src/features/proposals/components/ProposalCard.tsx` (3 navigate changes)
Replace `proposal.id` with `proposal.slug` in all 3 navigate calls (lines 97, 139, 142).

### 5. `src/pages/ProposalOverview.tsx`
- `useParams` extracts `slug` instead of `id`
- Use `useProposalDetailsBySlug(slug)` instead of `useProposalDetailsById(id)`
- `useProposalViews` keeps using `proposal?.id` (it needs the UUID for the DB query) — move it after proposal is available or pass `proposal?.id`
- Line 184 "Editar" button: `navigate(/orcamentos/${id})` → `navigate(/orcamentos/${proposal.slug})`
- Line 341 versions "Ver": `navigate(/orcamentos/${v.id}/overview)` → `navigate(/orcamentos/${v.slug}/overview)`
- `handleSetLatest`: after update, find target version from `versions` array to get its slug: `const target = versions.find(v => v.id === versionId); navigate(/orcamentos/${target?.slug}/overview)`

### 6. `src/pages/ProposalDetails.tsx`
- `useParams` extracts `slug` instead of `id`
- Use `useProposalDetailsBySlug(slug)` instead of `useProposalDetailsById(id)`
- Line 487 (createNewVersion): `navigate(/orcamentos/${newProposal.id})` → `navigate(/orcamentos/${newProposal.slug})`
- Line 652 breadcrumb: `proposal.id` → `proposal.slug`
- All other `proposal.id` usages for Supabase mutations stay as-is (they need the UUID)

### Important note
`useProposalViews(id)` in ProposalOverview needs the UUID, not the slug. It will change to `useProposalViews(proposal?.id)` — this means views won't load until proposal data arrives, which is fine since we already show a skeleton while loading.
