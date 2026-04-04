

# Fix: Thumbnails dos cases piscando a cada interação

## Problema

O componente `VimeoThumbnail` está definido **dentro** da função do componente `ProposalDetails`. Isso significa que a cada re-render (qualquer digitação, clique, mudança de estado), o React cria uma nova "definição" de componente, desmonta o antigo e monta um novo -- causando a piscada e re-fetch das thumbnails.

## Solução

Mover o componente `VimeoThumbnail` para **fora** do componente `ProposalDetails`, no nível do módulo. Como ele não depende de nenhum estado do componente pai (recebe tudo via props), basta extraí-lo.

## Alteração

**Arquivo: `src/pages/ProposalDetails.tsx`**
- Recortar a definição de `VimeoThumbnail` (linhas ~427-461) de dentro do componente e colar antes da definição do `ProposalDetails`
- Nenhuma outra mudança necessária -- props e uso permanecem idênticos

