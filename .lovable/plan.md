

# Correção de Layout: Páginas de Orçamentos fora do padrão

## Problema Identificado

As páginas `Proposals.tsx` e `NewProposal.tsx` não utilizam o `ResponsiveContainer` — o componente padrão do projeto que fornece padding, espaçamento e max-width consistentes. Todas as outras páginas (Tasks, Projects, Equipment, etc.) envolvem seu conteúdo com `<ResponsiveContainer maxWidth="7xl">`, mas as páginas de Orçamentos usam apenas um `<div className="space-y-6">` cru, sem padding nem margens.

Isso causa:
- Conteúdo colado nas bordas (sem padding lateral/vertical)
- Falta da animação `animate-fade-in` de entrada
- Inconsistência visual com o restante do app

## Correções

### 1. `src/pages/Proposals.tsx`
- Envolver todo o conteúdo com `<ResponsiveContainer maxWidth="7xl">` em vez do `<div className="space-y-6">`.

### 2. `src/pages/NewProposal.tsx`
- Mesmo ajuste: trocar o `<div>` raiz por `<ResponsiveContainer maxWidth="7xl">`.

### 3. `src/features/proposals/components/ProposalWizard.tsx`
- Remover o `max-w-3xl mx-auto` redundante do wrapper interno do wizard — o `ResponsiveContainer` já cuida do max-width e centralização. Pode manter um `max-w-3xl` apenas no card do wizard se desejado para limitar a largura do formulário.

Essas 3 alterações alinham as páginas de Orçamentos ao padrão estético do resto da plataforma.

