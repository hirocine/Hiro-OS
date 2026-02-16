

## Ajustar Card "Saldo Atual Disponivel" -- Conteudo no Topo

### Resumo

O card "Saldo Atual Disponivel" atualmente centraliza o conteudo verticalmente (`justify-center`), criando espaco vazio acima e abaixo. A mudanca e: alinhar o conteudo ao topo e reduzir ligeiramente o tamanho da fonte, mantendo whitespace natural embaixo -- igual ao padrao do card "Faturamento do Mes".

### Detalhes Tecnicos

**Arquivo editado:** `src/pages/Dashboard.tsx`

Mudancas na linha ~283:

1. Remover `justify-center` do card, deixando o conteudo alinhar ao topo naturalmente
2. Reduzir o valor de `text-3xl sm:text-4xl` para `text-2xl sm:text-3xl` (mesma escala do card de Faturamento)
3. O whitespace ficara naturalmente embaixo do conteudo

Mesma mudanca sera aplicada em `src/pages/CashFlow.tsx` para manter consistencia.

