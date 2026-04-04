

# Fix: Serviços Inclusos - merge dados salvos com categorias padrão

## Problema

O banco de dados só tem 1 card no bloco "Serviços" (Pré-produção) porque o Wizard só salvou as categorias que tinham itens. O parsing atual usa os cards do banco diretamente, sem preencher as categorias faltantes (Gravação, Pós-produção).

## Solução

No parsing (linha ~228), após mapear os cards do banco, fazer um **merge** com `DEFAULT_INCLUSO_CATEGORIES`: para cada categoria padrão, usar os dados salvos se existirem, senão usar o default. Isso garante que as 3 colunas sempre apareçam.

## Alteração

**Arquivo: `src/pages/ProposalDetails.tsx` (~linhas 228-235)**

Substituir o mapeamento direto por um merge:

```ts
incluso_categories: (() => {
  const savedCards = servicosBlock?.cards || [];
  // Merge: para cada categoria padrão, usar dados salvos se existirem
  return DEFAULT_INCLUSO_CATEGORIES.map(defaultCat => {
    const saved = savedCards.find((c: any) =>
      (c.titulo || c.categoria) === defaultCat.categoria
    );
    if (saved) {
      return {
        categoria: saved.titulo || saved.categoria,
        icone: saved.icone || defaultCat.icone,
        itens: saved.itens || defaultCat.itens,
        subcategorias: saved.subcategorias || defaultCat.subcategorias,
      };
    }
    return JSON.parse(JSON.stringify(defaultCat));
  });
})(),
```

Isso garante que mesmo que o Wizard tenha salvo apenas 1 categoria, as 3 colunas (Pré-produção, Gravação, Pós-produção) apareçam com seus itens corretos.

