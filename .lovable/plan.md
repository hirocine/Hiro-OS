

## Ajustes de Responsividade do Dashboard

### Problemas Identificados

1. **Secao 1 "Mes Atual"**: Os 3 cards usam `md:grid-cols-3` que ativa a partir de 768px -- apertado demais para 3 cards financeiros com textos longos. Valores e labels podem ficar truncados.

2. **Secao 2 "Faturamento"**: O grafico tem altura fixa `h-80` (320px) em todas as telas. No mobile, o grafico ocupa muito espaco vertical e os labels do eixo X ficam sobrepostos.

3. **Secao 3 "Indicadores"**: O grid `grid-cols-2` no mobile gera 5 linhas com 10 cards. Funciona mas os textos longos como "% MARGEM CONTRIBUICAO" podem truncar em telas pequenas.

4. **Textos financeiros**: `text-2xl font-bold` nos valores nao escala para mobile -- valores como "R$ 1.200.000,00" podem ultrapassar o card.

5. **Barras do grafico**: `barSize={32}` fixo pode ficar desproporcional em telas menores.

6. **Margem do chart**: Labels do eixo X (Jan, Fev...) podem cortar em telas estreitas.

### Solucao

**Arquivo: `src/pages/Dashboard.tsx`**

| Area | Atual | Proposto |
|------|-------|----------|
| Secao 1 grid | `grid-cols-1 md:grid-cols-3` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (2 cols no tablet, 3 no desktop) |
| Valores financeiros | `text-2xl font-bold` | `text-xl sm:text-2xl font-bold` (menor no mobile) |
| Textos "de/meta" | `text-sm` | `text-xs sm:text-sm` |
| Altura do grafico | `h-80` fixo | `h-60 sm:h-72 lg:h-80` (responsivo) |
| Secao titulos | `text-xl lg:text-2xl` | `text-lg sm:text-xl lg:text-2xl` |
| Indicadores grid | `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` | Manter (ja esta bom) |
| UnitCard titulo | `text-xs uppercase tracking-wider` | Adicionar `line-clamp-2` para evitar overflow |
| UnitCard valor | `text-xl lg:text-2xl` | `text-lg sm:text-xl lg:text-2xl` |
| Chart barSize | `32` fixo | Manter (recharts adapta automaticamente) |
| Chart XAxis | `fontSize: 12` | `fontSize: 10` no mobile via classe ou prop condicional |

### Detalhes Tecnicos

**1. Secao 1 -- Grid dos 3 cards (linha 155)**
```tsx
// De:
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

// Para:
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```
No tablet (640-1023px) mostra 2 cards na primeira linha e 1 na segunda. No desktop, 3 lado a lado.

**2. Valores financeiros responsivos (linhas 175, 200, 232, 267, 284)**
```tsx
// De:
<span className="text-2xl font-bold ...">

// Para:
<span className="text-xl sm:text-2xl font-bold ...">
```

**3. Altura do grafico responsiva (linha 303)**
```tsx
// De:
<div className="h-80">

// Para:
<div className="h-60 sm:h-72 lg:h-80">
```

**4. Titulos de secao responsivos (linhas 153, 253, 339)**
```tsx
// De:
<h2 className="text-xl lg:text-2xl font-semibold">

// Para:
<h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">
```

**5. UnitCard responsivo (componente UnitCard, linhas ~430-450)**
```tsx
// Titulo: adicionar line-clamp-2
<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider line-clamp-2">

// Valor: responsivo
<div className="text-lg sm:text-xl lg:text-2xl font-bold ...">
```

### Arquivo editado

| Arquivo | Acao |
|---------|------|
| `src/pages/Dashboard.tsx` | Ajustar breakpoints, tamanhos de texto e altura do grafico para responsividade |

