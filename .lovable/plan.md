

# Corrigir 3 problemas mobile na proposta pública

## Problema 1 — Logos sumindo (ProposalClients)
Os gradientes laterais que fazem o fade nas bordas do slider têm `w-[600px]` fixo. Em telas mobile (~375px), eles cobrem praticamente o slider inteiro, escondendo os logos.

**Arquivo**: `src/features/proposals/components/public/ProposalClients.tsx`
- Trocar `w-[600px]` por `w-[100px] md:w-[600px]` nos dois divs de gradiente (linhas 39-40)

## Problema 2 — Preço sobreposto (ProposalInvestimento)
O valor final tem `-mt-8` que em mobile com card menor causa sobreposição com o badge de desconto.

**Arquivo**: `src/features/proposals/components/public/ProposalInvestimento.tsx`
- Linha 70: trocar `-mt-8` por `md:-mt-8` para só aplicar o negative margin em desktop

## Problema 3 — Timeline sem linha vertical + vídeo sumiu (ProposalProximosPassos + ProposalPublicPage)

### 3a — Linha vertical no mobile
As linhas conectoras têm `hidden md:block` e são horizontais. No mobile (flex-col), precisa de uma linha vertical entre os steps.

**Arquivo**: `src/features/proposals/components/public/ProposalProximosPassos.tsx`
- Adicionar uma linha vertical entre steps no mobile: `block md:hidden` com `w-px` e altura adequada, posicionada abaixo do círculo

### 3b — Vídeo de fundo sumiu
O iframe de background na seção Próximos Passos tem `hidden md:block` (linha 108 do ProposalPublicPage). Remover o `hidden md:block` e deixar visível em mobile também, ou pelo menos mostrar uma versão simplificada.

**Arquivo**: `src/features/proposals/components/ProposalPublicPage.tsx`
- Linha 108: trocar `hidden md:block` por `block` para o vídeo de fundo ficar visível em mobile também
- Ajustar o gradiente lateral para mobile: em telas pequenas usar gradiente mais opaco para garantir legibilidade do texto

## Resumo
- 3 arquivos editados
- Todas as mudanças usam prefixos responsivos (`md:`) para não impactar o desktop

