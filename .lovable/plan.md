

## Alinhar Altura dos Cards com o Grafico

### Problema

Os cards de Meta Anual e Meta YTD na coluna esquerda estao menores que o card do grafico na coluna direita, causando desalinhamento visual.

### Solucao

**Arquivo: `src/pages/Dashboard.tsx`**

1. **Coluna esquerda**: Adicionar `h-full` ao container dos cards e usar `flex flex-col gap-4` em vez de `space-y-4`, com cada card recebendo `flex-1` para distribuir a altura igualmente e preencher toda a coluna.

2. **Grafico**: Aumentar a altura do grafico de `h-72` para `h-80` para dar mais espaco visual.

3. **Cards internos**: Adicionar `flex flex-col justify-between` nos cards para que o conteudo se distribua verticalmente dentro de cada card expandido.

### Detalhes tecnicos

Linha 249 -- Container da coluna esquerda:
```tsx
// De:
<div className="space-y-4">

// Para:
<div className="flex flex-col gap-4 h-full">
```

Linhas 250 e 267 -- Cards de Meta Anual e Meta YTD:
```tsx
// Adicionar flex-1 a cada Card:
<Card className="shadow-card hover:shadow-elegant transition-all duration-200 flex-1 flex flex-col">
```

Linhas 257 e 274 -- CardContent dos dois cards:
```tsx
// Adicionar flex-1 para empurrar conteudo:
<CardContent className="space-y-3 flex-1 flex flex-col justify-center">
```

Linha 295 -- Altura do grafico:
```tsx
// De:
<div className="h-72">

// Para:
<div className="h-80">
```

### Resultado

Os dois cards da esquerda crescem para ocupar a mesma altura total do card do grafico, ficando perfeitamente alinhados.

### Arquivo editado

| Arquivo | Acao |
|---------|------|
| `src/pages/Dashboard.tsx` | Ajustar classes CSS para alinhar alturas |

