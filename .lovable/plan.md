

# Add validation, WhatsApp test button, and textarea height to ProposalGuidedWizard Step 1

## File: `src/features/proposals/components/ProposalGuidedWizard.tsx`

### 1. Add `step1Errors` state (after line 108, in state section)
```ts
const [step1Errors, setStep1Errors] = useState({ projectNumber: false, clientName: false, projectName: false, whatsapp: false, validityDate: false });
```

### 2. Update `goNext` (line 578-594)
Insert validation block before the existing uniqueness check:
```ts
const goNext = async () => {
  if (step === 1) {
    const errors = {
      projectNumber: !projectNumber.trim(),
      clientName: !clientName.trim(),
      projectName: !projectName.trim(),
      whatsapp: whatsappNumber.replace(/\D/g, '').length < 12,
      validityDate: !validityDate,
    };
    setStep1Errors(errors);
    if (Object.values(errors).some(Boolean)) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    // existing uniqueness check follows...
  }
  setStep(prev => Math.min(prev + 1, STEPS.length - 1));
};
```
Move the existing `projectNumber.trim()` uniqueness check inside the `step === 1` block, after the validation passes.

### 3. Add error borders and clear-on-change to each Step 1 field

- **Line 822** (projectNumber Input): Add `className={step1Errors.projectNumber ? 'border-destructive' : ''}` and update onChange to also clear error
- **Line 826** (clientName Input): Same pattern
- **Line 832** (projectName Input): Same pattern
- **Line 842** (whatsapp Input): Same pattern
- **Line 848** (validityDate Button trigger): Add `border-destructive` to className when `step1Errors.validityDate`; clear error in onSelect

### 4. Add WhatsApp test button (after line 842)
```tsx
{whatsappNumber.replace(/\D/g, '').length >= 12 && (
  <Button type="button" variant="ghost" size="sm"
    className="mt-1 h-7 text-xs text-green-600 hover:text-green-700 px-2"
    onClick={() => window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`, '_blank')}>
    Testar WhatsApp →
  </Button>
)}
```

### 5. Change textarea rows (line 874)
Change `rows={3}` to `rows={4}`.

### 6. Remove disabled from Continuar button (line 881)
Remove `disabled={!clientName.trim() || !projectName.trim()}` — validation now handles this in `goNext`.

