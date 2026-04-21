
# Corrigir thumbnails do Vimeo no fluxo de seleção de cases em `/orcamentos/:slug`

## Diagnóstico
O ajuste anterior foi aplicado no arquivo errado para o fluxo que aparece no print.

A tela atual do usuário é a página de detalhes do orçamento (`/orcamentos/:slug`), que usa `src/pages/ProposalDetails.tsx` — não o `ProposalGuidedWizard.tsx`.

Nesse arquivo, o componente `VimeoThumbnail` ainda está com a lógica antiga:
- tenta `https://vumbnail.com/{id}.jpg`
- fallback para `https://i.vimeocdn.com/video/{videoId}_640.jpg` (URL inválida para esse uso)
- ignora `videoHash` na busca inicial

Resultado: os cards do banco de cases continuam pretos com placeholder, mesmo após a correção no wizard.

## Implementação

### Arquivo
- `src/pages/ProposalDetails.tsx`

### Mudança
Reescrever apenas o `VimeoThumbnail` local desse arquivo para seguir o mesmo padrão já corrigido no wizard:

1. Montar a URL do oEmbed com suporte a hash:
```ts
https://vimeo.com/api/oembed.json?url=https://vimeo.com/{id}/{hash}
```

2. Usar `thumbnail_url` retornado pelo Vimeo, com upgrade opcional para resolução maior.

3. Se o oEmbed falhar, fallback para:
```ts
https://vumbnail.com/{id}.jpg
```

4. Se a imagem do fallback também falhar, aí sim exibir o placeholder.

### Comportamento preservado
- Nenhuma mudança visual no card
- Nenhuma mudança em layout, classes ou estrutura da seleção
- Nenhuma mudança no botão “Adicionar Cases”
- Nenhuma mudança no parse dos links ou no banco

## Impacto esperado
A correção passa a cobrir exatamente a tela do screenshot:
- thumbnails do banco de cases na aba de seleção
- thumbnails de cases já adicionados nessa mesma página, porque ambos reutilizam o mesmo `VimeoThumbnail` local

## Escopo
- 1 arquivo alterado: `src/pages/ProposalDetails.tsx`
- Sem alterações em componentes públicos
- Sem alterações em schema, Supabase, hooks ou navegação
