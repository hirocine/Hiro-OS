

# Add `project_number` to proposal creation flow

## Changes (3 files)

### 1. `src/features/proposals/types/index.ts`
- Add `project_number?: string | null;` to `ProposalFormData` interface

### 2. `src/features/proposals/components/ProposalGuidedWizard.tsx` (~line 519)
- Add `project_number: projectNumber.trim() || null,` after `client_name` in the `createProposal.mutateAsync()` call

### 3. `src/features/proposals/hooks/useProposals.ts` (~line 156)
- Add `project_number: form.project_number || null,` after `project_name` in the insert object

No other files modified. No changes to `src/features/proposals/components/public/`.

