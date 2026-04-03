

# Correção definitiva do duplo scroll na proposta pública

## O que encontrei

O replay da sessão mostra um **ScrollBar do Radix UI** (componente `scroll-area.tsx`) aparecendo brevemente na tela. A causa raiz é uma combinação de:

1. **`scrollbar-gutter: stable`** no `html` — reserva espaço permanente para o scrollbar nativo. Na proposta pública (fundo preto), esse espaço aparece como uma faixa cinza/branca à direita
2. **O override `html:has(.proposal-page)`** muda para `scrollbar-gutter: auto`, mas **sem `!important`**, então perde para a regra original que está no mesmo nível de especificidade
3. Falta forçar `color-scheme: dark` no `html` quando a proposta está ativa — isso faz o scrollbar nativo renderizar com visual claro (theme do sistema)

## Correção (2 arquivos)

### 1. `src/index.css` — forçar override da proposta com `!important`

```css
html:has(.proposal-page) {
  scrollbar-gutter: auto !important;
  overflow-y: auto !important;
  background-color: hsl(0 0% 0%) !important;
  color-scheme: dark !important;
}

body:has(.proposal-page),
#root:has(.proposal-page) {
  overflow: visible !important;
  background-color: hsl(0 0% 0%) !important;
}
```

O `!important` é necessário aqui porque as regras globais no topo do arquivo estão no mesmo nível de especificidade. O `color-scheme: dark` faz o scrollbar nativo do browser renderizar escuro.

### 2. `src/features/proposals/components/ProposalPublicPage.tsx`

Sem mudanças — o `useLayoutEffect` já foi removido e o wrapper está correto com `overflow-x-hidden`.

### Por que vai funcionar desta vez

As tentativas anteriores falharam porque:
- O `!important` não estava nos overrides da proposta, então `scrollbar-gutter: stable` do html global ganhava
- O `color-scheme: dark` não estava sendo aplicado, então o scrollbar nativo ficava claro contra fundo preto
- Agora, com `!important` nos overrides específicos da proposta, as regras vencem qualquer conflito

