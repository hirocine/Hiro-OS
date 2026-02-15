

## Remover CardHeader redundante do CategoryManagement

### Problema

O titulo "Gerenciamento de Categorias" e subtitulo aparecem duas vezes: no `PageHeader` dinamico (implementado anteriormente) e dentro do `CardHeader` do componente `CategoryManagement`.

### O que muda

**Arquivo**: `src/components/Settings/CategoryManagement.tsx`

1. Remover o bloco `<CardHeader>` (linhas 575-580) que contem `CardTitle` e `CardDescription` duplicados
2. Adicionar `pt-4` ao `CardContent` para manter espaçamento adequado sem o header
3. Remover imports nao utilizados (`CardHeader`, `CardTitle`, `CardDescription`)

O conteudo do card (busca, botoes, tabela de categorias) permanece inalterado.

