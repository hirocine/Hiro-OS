

# Portfólio com thumbnails + criar cases + ajuste prompt entregáveis

## 1. `src/features/proposals/components/ProposalGuidedWizard.tsx` — Step 4 (Portfólio)

**Imports**: Add `Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter` from ui/dialog. Import `CASE_TAG_OPTIONS` from types.

**New state**:
- `showNewCaseDialog: boolean`
- `newCase: { client_name, campaign_name, vimeo_id, vimeo_hash, tags: string[], destaque: boolean }`

**Replace Step 4 card layout** (lines 790-818):

Each case becomes a visual card with:
- Thumbnail on the left: `<img src={\`https://vumbnail.com/${c.vimeo_id}.jpg\`} />` (aspect-video, rounded, w-28)
- Right side: client_name (font-medium), campaign_name (text-muted), tags as Badge components
- Selected state: `border-primary bg-primary/5` with Checkbox

**Add "+ Criar novo case" button** after the grid, opens `showNewCaseDialog`.

**New Case Dialog**:
- Fields: client_name, campaign_name, Vimeo URL (parse vimeo_id and vimeo_hash from URL), tags (multi-select checkboxes from `CASE_TAG_OPTIONS`), destaque checkbox
- Helper to parse Vimeo URL: extract ID from `vimeo.com/{id}` or `vimeo.com/{id}/{hash}`
- On submit: call `createCase.mutateAsync(newCase)`, then auto-select the new case ID via `setSelectedCaseIds(prev => [...prev, result.id])`
- Close dialog and toast success

**Empty state**: Keep existing message but add the "+ Criar novo case" button.

## 2. `supabase/functions/ai-proposal-assistant/index.ts` — finalize_transcript prompt

**Line 353**: Replace the entregáveis instruction:

```
Liste CADA entregável separadamente. Se há 3 webcasts, são 3 itens (ou 1 item com quantidade 3). Se há 5 aulas EAD, é 1 item com quantidade 5. Não agrupe projetos diferentes num só entregável.
```

With:

```
Para entregáveis, agrupe itens do mesmo tipo em UM ÚNICO entregável com a quantidade correta. Exemplo: se o projeto tem 5 aulas EAD de 5 minutos cada, crie 1 entregável 'EAD - Aulas de Treinamento' com quantidade '5' e descrição '5 aulas de 5 minutos'. NÃO crie 5 entregáveis separados. Só separe entregáveis quando forem de natureza diferente (ex: webcast é diferente de EAD, que é diferente de vídeo institucional) ou quando tiverem especificações diferentes (ex: 2 aulas de 5min e 3 aulas de 10min).
```

## Files changed

1. `src/features/proposals/components/ProposalGuidedWizard.tsx` — visual cards + new case dialog
2. `supabase/functions/ai-proposal-assistant/index.ts` — entregáveis prompt fix

No files in `src/features/proposals/components/public/` will be touched.

