# Hiro OS — Project Context

## How Hiro likes to work

Gabriel (the operator) **is not a developer** — he runs the production company and just wants a working tool. When he asks for something:

1. **Decide for him.** Don't list 3 options and ask which one — pick the safest one and execute. Only ask if there's genuinely no safe default.
2. **Default to zero-risk.** Prefer additive changes (new columns, new files) over destructive ones (drops, renames, schema migrations on populated tables). When a fix has both a "right" version and a "quick" version, ship the quick one if it can't break anything, and *flag* the right one for later.
3. **Customer-facing pages are sacred.** Anything in `src/features/proposals/components/public/*` is what clients see — never break that without explicit confirmation, even for "obvious" wins like a security fix. Document the risk and wait.
4. **Explain in Portuguese, in plain language.** Skip the jargon. "RLS policy sempre-true" → "qualquer pessoa com a URL consegue baixar os dados". When you have to use a term, define it.
5. **Always say what could break.** Even if the answer is "nothing" — Gabriel reads that line first to decide whether to trust you. Be honest.

## DS migration scope

The Hiro OS internal admin interface uses the new design system (`--ds-*` tokens, hairline borders, squared corners, HN Display + HN Text fonts, tabular nums for numbers/dates).

## DO NOT TOUCH unless explicitly requested

- **`src/features/proposals/components/public/*`** — public-facing proposal renderer (customer view). These pages have their own visual language (rounded corners, gradients, custom typography). Do **not** apply the DS migration unless the user explicitly asks.
- **`src/pages/ProposalPublic.tsx`** — thin wrapper that renders `ProposalPublicPage` from the public proposals feature above. Same rule: customer-facing, off-limits.
- **`src/pages/Auth.tsx`** — pre-auth login screen with a custom dark layout (full-bleed photo split, white-on-black, HN Display). Intentionally lives outside the internal DS so the first impression matches Hiro's brand, not the admin chrome.

## Known pre-existing TypeScript issues (not introduced by DS migration)

_None currently. The previous `loan_history` issue was resolved by switching the query in `EquipmentDetailsDialog.tsx` to the existing `loans` table._
