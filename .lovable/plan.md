

# Fix history fetch to load audit logs for all proposal versions

## File: `src/pages/ProposalOverview.tsx`

### Change (lines 87-101)
Replace the single-ID audit log query with a two-step fetch: first get all version IDs using `parent_id`, then query `audit_logs` with `.in('record_id', allIds)`. Also increase limit from 20 to 50.

