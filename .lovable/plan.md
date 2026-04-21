

# Corrigir thumbnails do Vimeo no fluxo de seleção de cases

## Diagnóstico

O componente `VimeoThumbnail` no `ProposalGuidedWizard.tsx` (linhas 86-107) tenta carregar a thumb em duas etapas:
1. `https://vumbnail.com/{id}.jpg`
2. Fallback: `https://i.vimeocdn.com/video/{id}_640.jpg` ← **URL inválida**

A segunda URL não funciona porque o CDN do Vimeo exige o *picture ID* (não o video ID). Além disso, **o `videoHash` é recebido mas nunca usado**, o que quebra vídeos unlisted (que precisam do hash para autorizar o oEmbed).

A página pública (`ProposalCases.tsx`) já resolve isso corretamente usando a **API oEmbed do Vimeo**, que retorna o `thumbnail_url` real e respeita o hash de vídeos unlisted.

## Solução

Reescrever o componente `VimeoThumbnail` em `src/features/proposals/components/ProposalGuidedWizard.tsx` (linhas 86-107) para seguir o **mesmo padrão da página pública**:

1. Tentar primeiro `https://vimeo.com/api/oembed.json?url=https://vimeo.com/{id}/{hash}` e usar `data.thumbnail_url` retornado.
2. Em caso de erro, fallback para `https://vumbnail.com/{id}.jpg`.
3. Se ambos falharem, mostrar o placeholder com ícone `Film`.

Isso garante que cases unlisted (com hash) carreguem a thumb correta, alinhando o comportamento do wizard com o da página pública e com o padrão de memory `mem://architecture/vimeo-asset-loading-strategy`.

## Escopo

- **1 arquivo alterado**: `src/features/proposals/components/ProposalGuidedWizard.tsx` (apenas linhas 86-107)
- Nenhum componente público em `components/public/` é tocado
- Nenhuma mudança em DB, hooks ou API

