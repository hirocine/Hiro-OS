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

**Migration is complete** for every internal page — `grep "ds-shell"` returns hits on every `src/pages/*.tsx` except the two exceptions listed below. `<Button>`, `<Card>`, `<CardContent>`, `<Progress>`, `<Alert>`, `<Badge>` from shadcn are not used outside `src/components/ui/*` itself.

### Patterns to follow when adding new code

- **Page shell:** wrap top-level page in `<div className="ds-shell ds-page">` (or `<div className="ds-shell ds-page"><div className="ds-page-inner">...</div></div>` for inner-padded pages). Look at any page in `src/pages/` other than the exceptions for an example.
- **Buttons:** `<button type="button" className="btn">` for default, add `primary`, `danger`, `sm`, `icon` modifiers as needed. Use lucide-react icons at `size={14} strokeWidth={1.5}`.
- **Tiles / cards:** flat `<div>` with `style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}` and `padding`. No shadow, no border-radius.
- **Titles:** `fontFamily: '"HN Display", sans-serif'` with `fontWeight: 500` and negative tracking (`letterSpacing: '-0.01em'` to `-0.015em`).
- **Muted text:** `color: 'hsl(var(--ds-fg-3))'`. Avoid `text-muted-foreground`.
- **Numbers / dates:** add `fontVariantNumeric: 'tabular-nums'`.
- **Progress bars:** flat hairline track. Pattern in `src/pages/ProjectWithdrawal.tsx` near the header.

### Enforced by ESLint

`hiro/require-ds-shell` (in `eslint-rules/require-ds-shell.js`) catches any `<DialogContent>` / `<ResponsiveDialogContent>` / `<SheetContent>` / `<DrawerContent>` that ships without `ds-shell` in className. Radix portal-renders that content outside the app's `.ds-shell` root, so DS-scoped styles (`.ds-shell .btn { … }`) wouldn't cascade in. Run `npm run lint` to verify.

## DO NOT TOUCH unless explicitly requested

- **`src/features/proposals/components/public/*`** — public-facing proposal renderer (customer view). These pages have their own visual language (rounded corners, gradients, custom typography). Do **not** apply the DS migration unless the user explicitly asks.
- **`src/pages/ProposalPublic.tsx`** — thin wrapper that renders `ProposalPublicPage` from the public proposals feature above. Same rule: customer-facing, off-limits.
- **`src/pages/Auth.tsx`** — pre-auth login screen with a custom dark layout (full-bleed photo split, white-on-black, HN Display). Intentionally lives outside the internal DS so the first impression matches Hiro's brand, not the admin chrome.

## Database state

Heavy audit completed across multiple sessions:

- **Performance advisor:** `auth_rls_initplan`, `duplicate_index`, `multiple_permissive_policies`, `unindexed_foreign_keys` all driven to zero or near-zero (only intentional remnants). Remaining `unused_index` warnings are expected — they're the FK indexes added in `96285f6c` that haven't seen traffic yet.
- **Security advisor:** 432 lints closed. The ~56 that remain are by-design: 48 `SECURITY DEFINER` functions executable by authenticated (RPCs like `has_role`, `log_audit_entry` — the pattern is correct), 5 by anon (proposta pública + login flow), 2 `rls_policy_always_true` on `proposal_views` (intentional public-tracking).
- **Postgres version:** 17.6.1.121 (upgraded from 17.4 in earlier session).
- **pg_net extension:** still in `public` schema. Decided not to move — 5 cron jobs reference `net.http_post(...)` and moving the extension would break them.

## Edge functions

All admin/sync edge functions are gated behind a `requireAuth` helper that accepts service_role (env key or JWT) or a real authenticated user — but **rejects bare anon JWT**. Pattern lives in `supabase/functions/auto-sync-instagram-posts/index.ts` and is repeated in:

- `manage-password`, `optimize-existing-images`, `process-equipment-images`, `get-recordings`
- `sync-ga4-data`, `sync-instagram-account`, `sync-instagram-audience`, `sync-instagram-post`, `sync-linkedin-post`, `auto-sync-instagram-posts`, `discover-instagram-posts`
- `ga4-oauth-callback` (state param checked against `user_roles` admin/producao)
- `ai-assistant` (full `auth.getUser()` verification)

The cron jobs that call these functions read the service_role key from `public._internal_config` via `public.get_internal_config('service_role_key')`.

## Known pending work

- **`ZAPSIGN_WEBHOOK_SECRET`** not yet provided — blocks "Jurídico Commit B" (contract signature webhook).
- **Service role key rotation** — pending in Supabase Dashboard.
- Five components are >1500 lines (`ProposalGuidedWizard`, `ProposalDetails`, `NewWithdrawalDialog`, `TaskDetails`, `ProposalWizard`). All are already in the DS visually; this is a maintainability concern, not a styling one.

## Known pre-existing TypeScript issues (not introduced by DS migration)

~280 escapes (`any`, `as any`, `as unknown as`) concentrated in proposals hooks that parse JSONB columns. Durable fix is to regenerate `database.types.ts` from Supabase — none of these are runtime bugs.
