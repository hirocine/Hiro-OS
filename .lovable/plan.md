

## Corrigir Overflow de Textos em Telas Menores

### Problemas Identificados nas Screenshots

1. **Secao "Mes Atual"**: O valor "R$ 180.000,00" e o texto "meta R$ 166.667,00" ficam na mesma linha com `flex justify-between`, causando overflow. O badge "Meta batida!" tambem empurra o conteudo.

2. **Secao "Faturamento (2026)"**: Os cards de Meta Anual e Meta YTD mostram "R$ 1.200.000,00" e "de R$ 2.000.000,00" na mesma linha, vazando em telas menores.

3. **Secao "Indicadores"**: Valores como "R$ 95.000,00" e "R$ 45.000,00" sao grandes demais para os UnitCards em grid de 2 ou 3 colunas.

### Solucao

**Arquivo: `src/pages/Dashboard.tsx`**

**1. Cards de Mes Atual e Faturamento -- empilhar valor e meta no mobile**

Trocar o layout `flex items-baseline justify-between` por um layout que empilha no mobile e fica lado a lado no desktop:

```tsx
// De:
<div className="flex items-baseline justify-between">
  <span className="text-xl sm:text-2xl font-bold">{valor}</span>
  <span className="text-xs sm:text-sm text-muted-foreground">meta {meta}</span>
</div>

// Para:
<div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
  <span className="text-xl sm:text-2xl font-bold">{valor}</span>
  <span className="text-xs text-muted-foreground">meta {meta}</span>
</div>
```

Aplicar em 4 locais: Faturamento do Mes (linha 174), Meta Anual (linha 266), Meta YTD (linha 283), e nos textos "de".

**2. Badge "Meta batida!" -- quebrar linha no mobile**

Mudar o CardTitle do Faturamento do Mes para permitir wrap:

```tsx
// De:
<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">

// Para:
<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 flex-wrap">
```

**3. UnitCard -- reduzir tamanho do valor e truncar texto longo**

```tsx
// Valor: reduzir para text-base no mobile
<div className="text-base sm:text-lg lg:text-xl font-bold truncate ...">

// Adicionar truncate ao valor para evitar overflow
```

**4. UnitCard -- reduzir padding interno no mobile**

Adicionar classes responsivas ao CardHeader e CardContent do UnitCard:

```tsx
<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
<CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
```

### Resumo de Alteracoes

| Local | Problema | Correcao |
|-------|----------|----------|
| Linhas de valor + meta (174, 266, 283) | Overflow horizontal | `flex-col sm:flex-row` empilha no mobile |
| CardTitle Faturamento do Mes (162) | Badge empurra conteudo | Adicionar `flex-wrap` |
| UnitCard valor (444) | Texto grande demais | `text-base sm:text-lg lg:text-xl` + `truncate` |
| UnitCard padding (434, 443) | Cards apertados | Padding menor no mobile |

### Arquivo editado

| Arquivo | Acao |
|---------|------|
| `src/pages/Dashboard.tsx` | Corrigir overflow de textos e paddings em telas menores |

