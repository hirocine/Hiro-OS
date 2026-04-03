

# Diagnóstico do Duplo Scroll na Proposta Pública

## O que encontrei

1. **Estou mexendo no componente correto**: A rota `/orcamento/:slug` renderiza `ProposalPublicPage` em `src/features/proposals/components/ProposalPublicPage.tsx`. Esse é o componente V2 com a estética cinematográfica (fundo preto, verde neon, Helvetica Now Display). Não existe um "modelo antigo" — só existe esse.

2. **O preview pode estar com cache**: Como o preview do Lovable usa um iframe, mudanças em CSS global (`index.css`) podem não refletir imediatamente. Você pode estar vendo uma versão cacheada.

3. **Pista do rodapé**: Depois do `<ProposalFooter />`, existe um spacer invisível `<div className="h-24 no-print" />` (96px de altura) na linha 136. Esse spacer empurra o conteúdo para além do viewport, o que pode contribuir para a área scrollável extra.

4. **Regra CSS perigosa encontrada**: Em `src/index.css` linha 255-258:
   ```css
   *, *::before, *::after {
     box-sizing: border-box;
     max-width: 100%;
   }
   ```
   O `max-width: 100%` em TODOS os elementos pode quebrar os elementos absolute-positioned (GlowSpots, gradientes, iframe do Vimeo) e causar comportamentos inesperados de layout.

5. **Conflito persistente**: Mesmo com os `!important` adicionados, o `scrollbar-gutter: stable` no `html` global (linha 13) pode ainda estar vencendo em alguma condição de race do CSS, porque `:has()` pode não ser avaliado no momento certo.

## Plano de correção definitiva

### 1. Remover o spacer desnecessário após o footer
**Arquivo**: `src/features/proposals/components/ProposalPublicPage.tsx`
- Remover `<div className="h-24 no-print" />` (linha 136) — ele adiciona 96px de espaço vazio após o footer que não serve para nada na proposta pública e contribui para scroll extra.

### 2. Excluir a proposta da regra wildcard `max-width: 100%`
**Arquivo**: `src/index.css`
- Alterar a regra `*, *::before, *::after` para excluir elementos dentro de `.proposal-page`:
  ```css
  *:not(.proposal-page *), *::before, *::after {
    box-sizing: border-box;
    max-width: 100%;
  }
  .proposal-page *, .proposal-page *::before, .proposal-page *::after {
    box-sizing: border-box;
  }
  ```

### 3. Forçar scroll único via abordagem nuclear
**Arquivo**: `src/index.css`
- Adicionar `height: auto` e `min-height: 100vh` explicitamente para `body` e `#root` quando a proposta está ativa, garantindo que nenhum deles crie um scroll container:
  ```css
  html:has(.proposal-page) {
    scrollbar-gutter: auto !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    background-color: #000 !important;
    color-scheme: dark !important;
  }
  body:has(.proposal-page),
  #root:has(.proposal-page) {
    overflow: visible !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    background-color: #000 !important;
  }
  ```

### 4. Esconder qualquer ScrollBar Radix residual na proposta
**Arquivo**: `src/index.css`
- Como segurança extra, esconder qualquer ScrollBar do Radix que possa vazar para a proposta:
  ```css
  .proposal-page [data-radix-scroll-area-scrollbar] {
    display: none !important;
  }
  ```

### Resumo dos arquivos
- `src/index.css` — corrigir wildcard `max-width`, fortalecer overrides da proposta, esconder ScrollBar Radix
- `src/features/proposals/components/ProposalPublicPage.tsx` — remover spacer `h-24` após footer

