

# Fix date timezone display + vimeo_id extraction

## 1. Date timezone fix — `ProposalCard.tsx` (lines 31, 131)

Add `T12:00:00` when parsing `validity_date` to prevent UTC midnight from shifting the date back 1 day in Brazilian timezone.

**Line 31**: `differenceInDays(new Date(proposal.validity_date + 'T12:00:00'), new Date())`

**Line 131**: `format(new Date(proposal.validity_date + 'T12:00:00'), "dd/MM/yyyy")`

ProposalDetails.tsx already uses `T12:00:00` — no changes needed there.

## 2. Vimeo ID extraction helper — `ProposalGuidedWizard.tsx`

Add a helper function to extract the numeric ID from either a pure number or a full URL:

```typescript
const extractVimeoId = (raw: string) => {
  if (!raw) return '';
  if (/^\d+$/.test(raw)) return raw;
  const match = raw.match(/(\d{6,})/);
  return match ? match[1] : raw;
};
```

Apply in 3 places:
- **Line 838-840** (card thumbnail): `https://vumbnail.com/${extractVimeoId(c.vimeo_id)}.jpg`
- **Line 892** (new case preview): already uses `parseVimeoUrl` which extracts correctly — no change needed
- **ProposalWizard.tsx line 620**: same fix with `extractVimeoId`

## Files changed

1. `src/features/proposals/components/ProposalCard.tsx` — date fix (2 lines)
2. `src/features/proposals/components/ProposalGuidedWizard.tsx` — add `extractVimeoId` + use it in thumbnails
3. `src/features/proposals/components/ProposalWizard.tsx` — use `extractVimeoId` in thumbnail

No files in `src/features/proposals/components/public/` will be touched.

