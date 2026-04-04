

# Fix: Serviços Inclusos mostrando apenas Pré-Produção

## Problema

O Wizard salva as categorias de serviços com o campo `titulo` (ex: `{ titulo: "Pré-Produção", icone: "...", itens: [...] }`), mas o componente de renderização espera o campo `categoria`. Na hora de parsear os dados do banco (linha 228), os cards são usados diretamente sem converter `titulo` para `categoria`, resultando em categorias sem nome e potencialmente quebrando a renderização das colunas de Produção e Pós-Produção.

## Solução

No parsing dos dados (linhas 223-229), mapear cada card do bloco "Serviços" para converter `titulo` -> `categoria`, garantindo compatibilidade com a interface `InclusoCategory`.

## Alteração

**Arquivo: `src/pages/ProposalDetails.tsx` (~linha 228)**

Substituir:
```ts
incluso_categories: servicosBlock?.cards || DEFAULT...
```

Por:
```ts
incluso_categories: servicosBlock?.cards
  ? servicosBlock.cards.map((c: any) => ({
      categoria: c.titulo || c.categoria,
      icone: c.icone,
      itens: c.itens,
      subcategorias: c.subcategorias,
    }))
  : JSON.parse(JSON.stringify(DEFAULT_INCLUSO_CATEGORIES)),
```

Isso garante que os 3 blocos (Pré-Produção, Produção, Pós-Produção) apareçam corretamente com seus itens e subcategorias.

