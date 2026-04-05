

# Redesenhar Step 8 (Investimento) — Cards de Pagamento

## Resumo
Substituir o Select de presets + textarea por 2 cards editáveis de opção de pagamento com toggle "Recomendado" (comportamento radio). Valores calculados automaticamente.

## Mudanças

**Arquivo:** `src/features/proposals/components/ProposalGuidedWizard.tsx`

### 1. State (linhas ~117, 132-133)
- Remover `paymentTerms`, `paymentPreset` states
- Adicionar:
```tsx
const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([
  { titulo: 'À Vista', valor: '', descricao: '5% de desconto para pagamento único', destaque: 'Melhor custo', recomendado: false },
  { titulo: '2x sem juros', valor: '', descricao: '50% no fechamento + 50% na entrega', destaque: '', recomendado: true },
]);
const [paymentNotes, setPaymentNotes] = useState('');
```

### 2. Cálculo automático dos valores
Adicionar `useEffect` que recalcula quando `finalValue` muda:
```tsx
useEffect(() => {
  setPaymentOptions(prev => prev.map((opt, i) => ({
    ...opt,
    valor: i === 0
      ? fmt(finalValue * 0.95)
      : `2x ${fmt(finalValue / 2)}`,
  })));
}, [finalValue]);
```

### 3. UI do Step 8 (linhas 1414-1453)
Substituir o card com Select/Textarea por:
- Manter os campos de Valor de Tabela, Desconto e Valor Final (já existem)
- Abaixo, renderizar 2 cards lado a lado (grid-cols-2), cada um com:
  - Input "Título"
  - Valor calculado exibido (text-xl font-bold, read-only)
  - Input "Descrição"
  - Input "Badge/Destaque" (opcional)
  - Switch + label "Recomendado" (toggle radio: ao ativar um, desativa o outro)
- Abaixo dos cards, Textarea "Observações de pagamento" (livre)

### 4. Toggle Recomendado (comportamento radio)
```tsx
const toggleRecomendado = (index: number) => {
  setPaymentOptions(prev => prev.map((opt, i) => ({
    ...opt,
    recomendado: i === index,
  })));
};
```

### 5. handleCreateProposal (linha ~487)
- Remover `payment_terms: paymentTerms`
- Adicionar `payment_terms: paymentNotes` (observações livres)
- O `useProposals.createProposal` já constrói `payment_options` internamente, mas agora precisa usar os valores do wizard em vez de hardcoded

### 6. useProposals.ts — Aceitar payment_options do form
- Adicionar `payment_options` ao `ProposalFormData` type
- No `createProposal` mutationFn, usar `form.payment_options` se fornecido, em vez do cálculo hardcoded

### 7. ProposalFormData type (types/index.ts)
- Adicionar campo `payment_options?: PaymentOption[]`

### 8. Revisão (Step 9, linha 1562)
- Atualizar o card de Investimento na revisão para mostrar as opções de pagamento

### 9. Imports
- Adicionar `Switch` de `@/components/ui/switch`
- Adicionar `PaymentOption` do types

### 10. Cleanup
- Remover constante `PAYMENT_PRESETS` (linhas 57-62)

