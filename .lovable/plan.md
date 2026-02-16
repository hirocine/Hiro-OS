

## Reduzir Fontes do Card "Saldo Atual" para Igualar ao "Faturamento do Mes"

### Resumo

Diminuir o tamanho da fonte do valor no card "Saldo Atual Disponivel" de `text-2xl sm:text-3xl` para `text-xl sm:text-2xl`, igualando ao padrao do card "Faturamento do Mes". O titulo ja usa `text-sm` em ambos, mas o card de saldo tem `uppercase tracking-wider` que da a impressao de ser maior -- vamos remover o `uppercase tracking-wider` e alinhar o estilo do titulo tambem.

### Detalhes Tecnicos

**Arquivos editados:** `src/pages/Dashboard.tsx` e `src/pages/CashFlow.tsx`

**Mudancas:**

1. Valor principal: `text-2xl sm:text-3xl` passa para `text-xl sm:text-2xl` (igual ao Faturamento)
2. Titulo: remover `uppercase tracking-wider` do CardTitle, mantendo apenas `text-sm font-medium text-primary/80` -- para igualar visualmente ao estilo dos outros cards
3. Icone do olho: reduzir de `h-5 w-5` para `h-4 w-4` para acompanhar a reducao geral

Mesmas mudancas aplicadas nos dois arquivos para consistencia.

