

# Thumbnails dos vídeos não aparecem no PDF

## Problema

O componente `ProposalCases.tsx` (página pública) usa `vumbnail.com/{vimeoId}.jpg` para gerar thumbnails de print. Porém, vídeos **não listados** no Vimeo exigem o `hash` na URL -- o vumbnail.com não suporta isso e retorna erro, resultando em imagens quebradas.

O editor (`ProposalDetails.tsx`) já resolve isso corretamente usando a API oEmbed do Vimeo com o hash, mas o componente público não.

## Solução

### 1. Adicionar resolução de thumbnail via oEmbed no `ProposalCases.tsx`

Criar um sub-componente `CaseCard` que usa `useEffect` + `fetch` para buscar a thumbnail real via oEmbed (mesmo padrão do `VimeoThumbnail` que já existe no editor):

- Construir URL: `https://vimeo.com/api/oembed.json?url=https://vimeo.com/{vimeoId}/{vimeoHash}`
- Extrair `thumbnail_url` da resposta
- Fallback para `vumbnail.com` se oEmbed falhar
- Renderizar a `<img>` **sempre visível** como background do card (não apenas em print), com o iframe por cima

### 2. Layout: thumb sempre visível, iframe por cima

Em vez de esconder a thumbnail e mostrar só no print:
- `<img>` da thumbnail: `absolute inset-0 w-full h-full object-cover` (sempre visível, serve como "poster")
- `<iframe>`: `absolute inset-0 w-full h-full` por cima (reproduz o vídeo na web)
- No print: iframe fica `print:hidden`, thumbnail já está visível naturalmente

Isso elimina a dependência do print CSS para mostrar thumbnails e garante que funcionem tanto na web (como poster enquanto o iframe carrega) quanto no PDF.

### Arquivos alterados

- `src/features/proposals/components/public/ProposalCases.tsx` -- refatorar para usar oEmbed e thumbnail sempre visível

