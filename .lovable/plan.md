

# Redesign do Header da Proposta Pública

## Resumo

Simplificar o ProposalHeader: remover links de navegação (Sobre nós, Cases, Instagram, Contato), manter apenas logo (menor) à esquerda e botões "Aprovar Orçamento" + "PDF" à direita. O header NÃO é fixo — fica no topo normalmente. Quando o usuário scrolla para baixo e o header sai da tela, os botões aparecem flutuantes. Ao voltar ao topo, os botões voltam para o header.

## Comportamento de Scroll

```text
Estado 1 – Topo (header visível):
┌─────────────────────────────────────────────────────┐
│ ⏰ Urgency Bar (fixa)                               │
├─────────────────────────────────────────────────────┤
│ [HIROヒロシ®]          [Aprovar Orçamento] [PDF]    │
│ (logo menor)           (botões inline)              │
├─────────────────────────────────────────────────────┤
│ Hero / Conteúdo...                                  │
└─────────────────────────────────────────────────────┘
  → Botões flutuantes OCULTOS

Estado 2 – Scrollou para baixo (header fora da tela):
┌─────────────────────────────────────────────────────┐
│ ⏰ Urgency Bar (fixa)                               │
├─────────────────────────────────────────────────────┤
│ Conteúdo...                                         │
│                                                     │
│              ┌──────────────────────────┐           │
│              │ [Aprovar] [PDF] (float)  │           │
│              └──────────────────────────┘           │
└─────────────────────────────────────────────────────┘
  → Botões flutuantes VISÍVEIS
```

## Alterações

### 1. `ProposalHeader.tsx`

- Remover TODOS os links de navegação, Instagram, botão Contato, menu hamburger mobile
- Manter apenas logo à esquerda (reduzir de `h-5 sm:h-6` para `h-4 sm:h-5`)
- Adicionar botões "Aprovar Orçamento" e "PDF" à direita (mesmo estilo dos atuais FloatingActions)
- Mudar de `fixed` para posição estática (relativa ao fluxo do documento)
- Receber `projectName` como prop para construir o link WhatsApp
- Usar `ref` no header para detectar visibilidade via IntersectionObserver

### 2. `FloatingActions.tsx`

- Adicionar prop `visible: boolean` que controla se os botões flutuantes aparecem
- Aplicar transição suave (opacity + translate) para entrada/saída

### 3. `ProposalPublicPage.tsx`

- Usar `useRef` + `IntersectionObserver` no ProposalHeader para detectar quando ele sai/entra na viewport
- Criar estado `headerVisible` que controla a visibilidade dos FloatingActions
- Passar `projectName` para o ProposalHeader
- Passar `visible={!headerVisible}` para FloatingActions

## Arquivos

| Arquivo | Alteração |
|---|---|
| `src/features/proposals/components/ProposalHeader.tsx` | Simplificar: só logo + botões de ação, posição estática, aceitar `projectName` |
| `src/features/proposals/components/FloatingActions.tsx` | Adicionar prop `visible` com transição |
| `src/features/proposals/components/ProposalPublicPage.tsx` | IntersectionObserver no header, controlar visibilidade dos floating actions |

