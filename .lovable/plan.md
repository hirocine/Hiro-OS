

# Validação de campos obrigatórios + WhatsApp pre-fill

## Arquivo: `src/pages/ProposalDetails.tsx`

### 1. WhatsApp pre-fill
- **Line 155**: Initial state `whatsapp_number: ''` → `whatsapp_number: '+55 '`
- **Line 174**: `formatWhatsApp(proposal.whatsapp_number || '')` → `proposal.whatsapp_number ? formatWhatsApp(proposal.whatsapp_number) : '+55 '`

### 2. Error state (after line ~164)
```tsx
const [clientErrors, setClientErrors] = useState({ project_number: false, whatsapp_number: false, validity_date: false });
const [investErrors, setInvestErrors] = useState({ list_price: false });
```

### 3. Validation in `saveSection` (line 362, before the `if (section === 'client')` data block)
Add validation checks that call `toast.error` and `return` early if errors found. WhatsApp validation: digits < 12 chars means invalid.

### 4. Visual error indicators on 4 fields
- **Line 716** (Nº do Projeto input): add conditional `border-destructive` + error `<p>` below
- **Line 720** (WhatsApp input): add conditional `border-destructive` + error `<p>` below
- **Line 725** (Validade date picker button): add conditional `border-destructive` + error `<p>` after Popover
- **Line 779** (Valor sem desconto input): add conditional `border-destructive` + error `<p>` below

### 5. Clear errors on change
- project_number onChange (line 716): add `setClientErrors(p => ({ ...p, project_number: false }))`
- whatsapp onChange (line 720): add `setClientErrors(p => ({ ...p, whatsapp_number: false }))`
- validity_date onSelect (line 736): add `setClientErrors(p => ({ ...p, validity_date: false }))`
- list_price onChange (line 783): add `setInvestErrors(p => ({ ...p, list_price: false }))`

No structural/styling changes beyond the error borders and messages.

