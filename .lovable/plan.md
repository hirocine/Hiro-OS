

## Padronizar alturas e layouts das barras de busca na Administração

### Problema raiz

A diferença visual vem de duas causas:

1. **Alturas diferentes**: O componente `Input` usa `h-10` (40px), mas o `SelectTrigger` usa `min-h-[44px]` (44px). Quando estao lado a lado, o select fica mais alto que o input.
2. **Categorias**: O componente `CategoryManagement` envolve seu conteudo em `space-y-4`, que fica dentro do `TabsContent` que tambem tem `space-y-4`, criando espaçamento duplicado. Alem disso, a estrutura do search bar difere das outras abas.

### Correções

**Arquivo 1: `src/pages/Admin.tsx`**

- Aba **Usuarios** (linha 589): Adicionar `h-10` ao `SelectTrigger` para forçar a mesma altura do Input
- Aba **Logs** (linha 737): Adicionar `h-10` ao `SelectTrigger` para forçar a mesma altura do Input

**Arquivo 2: `src/components/Settings/CategoryManagement.tsx`**

- Linha 581: Remover o wrapper `space-y-4` externo (o `TabsContent` ja fornece `space-y-4`)
- Manter a estrutura do search bar como esta (ja usa o padrao correto de icone/padding)

### Resultado esperado

- Todas as barras de busca e selects terao exatamente 40px de altura
- O espaçamento da aba Categorias ficara identico ao das outras abas

