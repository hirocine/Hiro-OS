

# Add Payment Options editing to ProposalDetails invest section

## File: `src/pages/ProposalDetails.tsx`

### 1. Import `PaymentOption` type (line 33)
Add `PaymentOption` to the existing import from `'../features/proposals/types'`.

### 2. State — add `payment_options` to `investForm` (line 159)
Change investForm initial state to include `payment_options: [] as PaymentOption[]`.

### 3. Populate — add `payment_options` in useEffect (line 183-187)
Add `payment_options: proposal.payment_options || []` to the setInvestForm call.

### 4. Auto-calculate useEffect (new, after line 540)
Add useEffect watching `investFinalValue` that recalculates payment option values:
- If `investFinalValue <= 0`, skip
- Map options: index 0 gets `fmt(val * 0.95)`, index 1 gets `2x fmt(val / 2)`

### 5. Dirty check — update `investDirty` (lines 255-260)
Add `JSON.stringify(investForm.payment_options) !== JSON.stringify(proposal?.payment_options || [])` to the comparison.

### 6. Save — include `payment_options` in invest section data (lines 433-441)
Add `payment_options: investForm.payment_options` to the data object.

### 7. UI — add payment options editor after the Textarea (line 849)
Below the "Condições de Pagamento" textarea, add:
- Label "Opções de Pagamento"
- If array empty: button "Adicionar opções padrão" that sets 2 default options (À Vista + 2x)
- If array has items: grid-cols-2 with Cards, each containing:
  - Input "Título"
  - Read-only calculated value display
  - Input "Descrição"
  - Input "Badge / Destaque"
  - Switch "Recomendado" (radio behavior)
  - Badge "RECOMENDADO" when active

Same layout as ProposalGuidedWizard lines 1460-1526.

### Import needed
Add `cn` from `@/lib/utils` if not already imported.

No other files modified. No changes to `src/features/proposals/components/public/`.

