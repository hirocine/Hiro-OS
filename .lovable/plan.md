

## Reverter Blur para Pontinhos nos Valores Financeiros

### Resumo

Substituir o efeito `blur-sm select-none` por mascaramento com texto "R$ ••••••" em todos os valores financeiros ocultos, tanto no Dashboard quanto na pagina de Fluxo de Caixa.

### Detalhes Tecnicos

**Arquivos editados:** `src/pages/Dashboard.tsx` e `src/pages/CashFlow.tsx`

**Mudancas:**

1. **Criar funcao `displayValue`** em ambos os arquivos:
   ```text
   const displayValue = (v: number) => valuesHidden ? 'R$ ••••••' : formatCurrency(v);
   ```

2. **Dashboard.tsx - CashFlowDashCard:**
   - Trocar props `blurred` e `subtitleBlurred` por `displayValue: (v: number) => string`
   - Remover `blur-sm select-none` do valor, usar `{displayValue(value)}` no lugar de `{formatCurrency(value)}`
   - Subtitle do "Fluxo Liquido": passar o texto ja formatado com pontinhos quando oculto
   - Todas as chamadas passam `displayValue={displayValue}` ao inves de `blurred={valuesHidden}`

3. **Dashboard.tsx - Card "Saldo Atual":**
   - Trocar `blur-sm select-none` + `formatCurrency` por `{displayValue(cashFlow.total_balance)}`

4. **Dashboard.tsx - Tooltip do grafico:**
   - Trocar blur por `{valuesHidden ? 'R$ ••••••' : formatCurrency(val)}`

5. **CashFlow.tsx - CashFlowCard:**
   - Mesma mudanca: trocar `blurred`/`subtitleBlurred` por `displayValue`
   - Remover blur classes, usar `{displayValue(value)}`

6. **CashFlow.tsx - Card "Saldo Atual" e Tooltip:**
   - Mesma logica: usar `displayValue` no lugar de blur

7. **Subtitle do "Fluxo Liquido"** em ambos os arquivos:
   - Quando oculto: `"R$ •••••• - R$ ••••••"` 
   - Quando visivel: texto normal com valores formatados

