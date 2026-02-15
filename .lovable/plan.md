

## Criar skeletons fieis ao layout real de cada pagina

### Problema

Atualmente, existem dois niveis de skeleton generico:

1. **Suspense fallback** (`LoadingScreenSkeleton`): usado em todas as rotas do `App.tsx` — mostra apenas uma barra de titulo e 6 retangulos identicos, independente da pagina
2. **Loading inline das paginas**: cada pagina tem seu proprio skeleton, mas alguns sao genericos demais (ex: SSDs mostra 3 colunas altas sem stats cards; Equipment mostra 6 cards genericos sem filtros)

Isso causa estranheza porque o skeleton nao reflete o layout que vai aparecer em seguida.

### Solucao

Criar skeletons dedicados que espelham o layout real de cada pagina principal. Os skeletons serao colocados inline nas paginas (substituindo os atuais), e o Suspense fallback generico sera mantido apenas como fallback de ultimo recurso (carregamento do chunk JS).

### Paginas a corrigir

**1. SSDs (`src/pages/SSDs.tsx`)**
- Atual: 3 colunas altas genericas
- Correto: PageHeader + grid 4 stats cards + 3 colunas kanban com cards internos

**2. Equipment (`src/pages/Equipment.tsx`)**
- Atual: 6 cards genericos identicos
- Correto: PageHeader + stats cards row + barra de filtros + tabela com linhas skeleton (ou grid de cards no mobile)

**3. Projects (`src/pages/Projects.tsx`)**
- Ja usa `ProjectStatsCards` com skeleton e `ProjectCardSkeleton` — verificar se o loading state completo espelha a pagina (stats + lista de cards)

**4. Suppliers (`src/pages/Suppliers.tsx`)**
- Verificar se tem skeleton dedicado ou se usa generico

**5. Companies (`src/pages/Companies.tsx`)**
- Verificar se tem skeleton dedicado ou se usa generico

**6. Tasks (`src/pages/Tasks.tsx`)**
- Nao tem loading state visivel no codigo inicial — adicionar skeleton com calendar widget + summary bar + tabela

### Implementacao tecnica

Para cada pagina, o loading state inline sera atualizado para refletir:

1. **PageHeader** (titulo + subtitulo) como skeleton
2. **Stats cards** na mesma grid da pagina real
3. **Filtros/barra de busca** como skeleton
4. **Conteudo principal** (tabela, kanban, grid) com formato correto

Exemplo para SSDs:
```text
+------------------------------------------+
| [===] Controle de SSDs     [===========] |  <- PageHeader skeleton
+------------------------------------------+
| [Stats] [Stats] [Stats] [Stats]          |  <- 4 cards em grid
+------------------------------------------+
| [Kanban Col] [Kanban Col] [Kanban Col]   |  <- 3 colunas com cards
| [  card  ]   [  card  ]   [  card  ]     |
| [  card  ]   [  card  ]                  |
+------------------------------------------+
```

### Arquivos a editar

- `src/pages/SSDs.tsx` — substituir skeleton de loading
- `src/pages/Equipment.tsx` — substituir `loadingSkeletons` generico
- `src/pages/Suppliers.tsx` — adicionar/melhorar skeleton de loading
- `src/pages/Companies.tsx` — adicionar/melhorar skeleton de loading
- `src/pages/Tasks.tsx` — adicionar skeleton de loading
- `src/pages/Projects.tsx` — verificar e ajustar se necessario

Nenhuma nova dependencia necessaria. Reutilizaremos o componente `Skeleton` existente e a classe `animate-pulse` ja disponivel.

