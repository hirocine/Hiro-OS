

# Add "Serviços Inclusos" and "Depoimento" steps to ProposalGuidedWizard

## Overview

Insert 2 new steps between "Entregáveis" (step 5) and "Investimento" (step 6), making the wizard go from 8 to 10 steps total.

## Changes — `src/features/proposals/components/ProposalGuidedWizard.tsx`

### 1. Update STEPS array (line 45-54)

Add two new entries after `entregaveis`:

```
{ key: 'inclusos', label: 'Serviços Inclusos', icon: ListChecks },
{ key: 'depoimento', label: 'Depoimento', icon: MessageSquareQuote },
```

Import `ListChecks, MessageSquareQuote` from lucide-react. Steps become: Briefing(0), Dados(1), Objetivo(2), Dores(3), Portfólio(4), Entregáveis(5), **Serviços Inclusos(6)**, **Depoimento(7)**, Investimento(8), Revisão(9).

### 2. New state

- `inclusoCategories`: initialized with `JSON.parse(JSON.stringify(DEFAULT_INCLUSO_CATEGORIES))` (deep clone)
- `selectedTestimonialId`: `string | null` for radio-style selection

### 3. Update `handleCreateProposal` (line 255)

Change `incluso_categories` from hardcoded `DEFAULT_INCLUSO_CATEGORIES` to `inclusoCategories`.

### 4. Update all step numbers

All `{step === N && ...}` blocks after step 5 shift by +2:
- Investimento: 6 → 8
- Revisão: 7 → 9

### 5. New Step 6 — Serviços Inclusos

- Header: "Selecione os serviços inclusos nesta proposta"
- Render 3 cards (or stacked on mobile) from `inclusoCategories`:
  - **Pré-produção**: flat list of checkboxes
  - **Gravação**: grouped by subcategories (Equipe, Equipamentos, Produção) with subcategory headers
  - **Pós-produção**: flat list of checkboxes
- Each item is a checkbox toggling `ativo`
- Items with `quantidade` field (e.g. Câmeras) show an Input when checked
- "+ Adicionar item" button per category/subcategory appends a custom item `{ nome: '', ativo: true, custom: true }`
- Helper functions: `toggleInclusoItem`, `updateInclusoQuantidade`, `addCustomInclusoItem`

### 6. New Step 7 — Depoimento

- Header: "Escolha um depoimento de cliente para incluir na proposta"
- If `testimonialsBank.length > 0`: render selectable cards with Avatar (image or initials), name, role, text preview
- Radio-style: clicking selects one and fills `testimonialName/Role/Text/Image`
- Selected card has `border-primary bg-primary/5`
- "Pular sem depoimento" link at bottom that just calls `goNext()`
- If bank is empty: show manual input fields (name, role, text) inline

### 7. Update Revisão Final (step 9)

Add two new summary cards between Entregáveis and Investimento:

- **Serviços Inclusos**: count of active items, click navigates to step 6
- **Depoimento**: show selected testimonial name or "Nenhum depoimento", click navigates to step 7

## Files changed

1. `src/features/proposals/components/ProposalGuidedWizard.tsx` — all changes in this single file

No files in `src/features/proposals/components/public/` will be touched.

