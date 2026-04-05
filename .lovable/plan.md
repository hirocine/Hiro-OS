

# Fix WhatsApp formatting, project number maxLength, and uniqueness validation in ProposalGuidedWizard

## File: `src/features/proposals/components/ProposalGuidedWizard.tsx`

### 1. Add `formatWhatsApp` helper (before the component, ~line 58)
Add the formatting function that auto-prefixes `55` and applies the mask `+55 (XX) XXXXX-XXXX`.

### 2. Import supabase client (line 1 area)
Add `import { supabase } from '@/integrations/supabase/client';` — needed for the uniqueness query.

### 3. Update WhatsApp state and input
- **Line 103**: Change `useState('')` to `useState('+55 ')` for `whatsappNumber`
- **Line 814**: Change the Input to use `onChange={e => setWhatsappNumber(formatWhatsApp(e.target.value))}` and add `maxLength={20}`

### 4. Add `maxLength={4}` to project number input (line 794)

### 5. Add uniqueness validation for project_number
- **Line 566**: Change `goNext` from a simple arrow to an async function that checks the current step. For step 1 (dados), run the uniqueness query before advancing. For all other steps, advance normally.

```ts
const goNext = async () => {
  if (step === 1 && projectNumber.trim()) {
    const { data: existing } = await supabase
      .from('orcamentos')
      .select('id, project_name, client_name')
      .eq('project_number', projectNumber.trim())
      .maybeSingle();
    if (existing) {
      toast.error(
        `Nº ${projectNumber} já existe (${(existing as any).client_name} — ${(existing as any).project_name}). Considere criar uma nova versão desse orçamento.`,
        { duration: 6000 }
      );
      return;
    }
  }
  setStep(prev => Math.min(prev + 1, STEPS.length - 1));
};
```

`toast` from sonner is already imported (line 26). No other changes.

