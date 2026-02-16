

## Ocultar Linha de "Realizado" para Meses Futuros (valor zero)

### Problema
A linha "Realizado" no grafico conecta todos os 12 meses, incluindo os meses futuros que tem valor zero, criando uma queda abrupta no grafico.

### Solucao

**Arquivo: `src/pages/Dashboard.tsx`**

Criar um `useMemo` que filtra o `monthlyData` para separar os dados da linha: substituir o valor `realizado` por `null` nos meses onde o valor e zero. O Recharts automaticamente interrompe a linha quando encontra `null` em um dataKey, desde que se adicione `connectNulls={false}` (comportamento padrao).

Alternativa mais limpa: usar uma propriedade computada `realizadoVisible` que retorna o valor real ou `null`:

```tsx
const chartData = useMemo(() =>
  monthlyData.map(d => ({
    ...d,
    realizado: d.realizado > 0 ? d.realizado : null,
  })),
  [monthlyData]
);
```

Depois, passar `chartData` no lugar de `monthlyData` no `ComposedChart`:

```tsx
<ComposedChart data={chartData} ...>
```

E adicionar `connectNulls={false}` na `Line` (para garantir que a linha para):

```tsx
<Line
  ...
  connectNulls={false}
/>
```

### Resultado
A linha "Realizado" para no ultimo mes com dados reais (Setembro) e nao conecta aos meses futuros com valor zero. As barras de Meta continuam aparecendo para todos os 12 meses.

### Arquivo editado

| Arquivo | Acao |
|---------|------|
| `src/pages/Dashboard.tsx` | Adicionar `useMemo` para `chartData` e usar no grafico |

