

# CRM Critical Fixes — 6 Issues

## 1. Fix enums in `src/features/crm/types/crm.types.ts`

**CONTACT_TYPES** (lines 36-41): Replace with `lead`, `cliente_ativo`, `cliente_antigo`, `parceiro`, `fornecedor`.

**LEAD_SOURCES** (lines 43-50): Add `cold_outreach` and `site`.

**ACTIVITY_TYPES** (lines 52-58): Replace entirely with 9 types: `nota`, `ligacao`, `whatsapp`, `email`, `reuniao`, `follow_up`, `proposta`, `visita`, `outro`.

## 2. Update `src/features/crm/components/activities/ActivityItem.tsx`

- Add imports: `MessageCircle, Bell, FileText, MapPin, MoreHorizontal` from lucide-react
- Remove `CheckSquare` import
- Update `iconMap` to include all 9 types (whatsapp: MessageCircle, follow_up: Bell, proposta: FileText, visita: MapPin, outro: MoreHorizontal)
- Update `typeLabels` to include all 9 types

## 3. Remove duplicate Activities headers in detail pages

**`src/pages/CRMContactDetail.tsx`** (lines 159-170): Remove the outer section header (the `div` with border-b containing "Atividades" icon+text at lines 162-167). Keep the `<Card><CardContent>` wrapper but render `<ActivitiesList>` directly inside without the duplicate header.

**`src/pages/CRMDealDetail.tsx`** (lines 131-142): Same change — remove the "Atividades" section header div, keep Card/CardContent with ActivitiesList directly.

## 4. Add spacing wrapper in detail pages

**`src/pages/CRMContactDetail.tsx`**: After `<BreadcrumbNav>`, wrap the three Cards (summary, deals, activities) in `<div className="space-y-6">`.

**`src/pages/CRMDealDetail.tsx`**: After `<BreadcrumbNav>`, wrap all Cards (summary, pipeline stepper, activities) in `<div className="space-y-6">`.

## 5. Delete confirmation in `src/features/crm/components/contacts/ContactsList.tsx`

- Import `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle` from `@/components/ui/alert-dialog`
- Add state: `deletingContactId: string | null`
- Replace direct `deleteContact.mutate(c.id)` with `setDeletingContactId(c.id)`
- Add AlertDialog at bottom with confirmation text: "Tem certeza que deseja excluir este contato? Esta acao nao pode ser desfeita." On confirm: `deleteContact.mutate(deletingContactId)` then reset state.

## Summary of files changed

1. `src/features/crm/types/crm.types.ts` — fix 3 enum arrays
2. `src/features/crm/components/activities/ActivityItem.tsx` — update iconMap + typeLabels
3. `src/pages/CRMContactDetail.tsx` — remove duplicate header, add space-y-6
4. `src/pages/CRMDealDetail.tsx` — remove duplicate header, add space-y-6
5. `src/features/crm/components/contacts/ContactsList.tsx` — add delete confirmation dialog

No changes to `src/features/proposals/components/public/`.

