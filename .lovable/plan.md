

## Igualar altura visual dos subitens com os itens normais

### Problema

Os subitens ("Gerais", "Privadas") parecem visualmente menores que os itens normais ("Projetos AV"), mesmo ambos usando `py-2.5`. A diferenca e perceptual: itens normais ativos tem fundo (`bg-primary/10`) que preenche a linha toda, enquanto os subitens dentro da box agrupadora nao tem fundo proprio, parecendo mais compactos.

### Solucao

Aumentar o padding vertical dos subitens de `py-2.5` para `py-3`, igualando visualmente a altura percebida. Aplicar nos dois arquivos.

### Alteracoes

**`src/components/Layout/DesktopSidebar.tsx`** -- linha 176:

Trocar `py-2.5` por `py-3` nos subitens (NavLink dentro do CollapsibleContent).

**`src/components/Layout/MobileSidebar.tsx`** -- mesma alteracao nos subitens (linha ~129).

### Resultado

Subitens ficam com a mesma altura visual dos itens pai e dos itens normais da sidebar.

