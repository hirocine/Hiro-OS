
Objetivo: eliminar de vez o “duplo scroll” na proposta pública e parar de empilhar overrides conflitantes.

Diagnóstico encontrado:
- A rota pública `/orcamento/:slug` não usa `Layout`, então o problema não vem da sidebar/topbar.
- O `ProposalPublicPage` já tenta forçar `html/body/#root`, mas isso está brigando com regras globais de `src/index.css`.
- Existe um suspeito forte fora da proposta: `src/App.css` ainda contém o CSS padrão do Vite para `#root`:
  - `max-width: 1280px`
  - `margin: 0 auto`
  - `padding: 2rem`
  Isso pode criar uma “faixa/coluna” residual e alterar a área útil do documento em páginas full-bleed como a proposta.
- Em `src/index.css`, hoje há múltiplas regras globais conflitantes:
  - `html { overflow-y: scroll !important; scrollbar-gutter: stable !important; }`
  - `body { overflow-y: auto !important; }`
  - overrides extras com `:has(.proposal-page)`
  - override via `useLayoutEffect` dentro da própria página
- O replay também indica aparição de `ScrollBar` do componente `scroll-area`, então além do scrollbar nativo há chance de uma barra estilizada aparecer em algum container montado pela app shell. Como a rota pública não usa `ScrollArea` diretamente, a prioridade é remover a origem estrutural antes de mexer em paliativos.

Plano de correção:
1. Neutralizar `src/App.css`
- Remover o CSS padrão do Vite para `#root` ou zerar esse arquivo.
- Garantir que `#root` não imponha `max-width`, `margin`, `padding` ou `text-align`.
- Isso é importante porque a proposta pública precisa ocupar a viewport inteira sem um wrapper legado.

2. Simplificar a estratégia de scroll global
- Em `src/index.css`, parar de manter `html` e `body` com donos diferentes do scroll.
- Escolher um único dono do scroll para o app inteiro:
  - `html/body/#root` sem cadeia conflitante de `overflow-y: scroll` + `overflow-y: auto`.
- Para a proposta pública, remover a lógica de exceção excessiva baseada em `:has(.proposal-page)` se ela estiver só mascarando o problema.

3. Remover o hack imperativo do `ProposalPublicPage`
- Tirar ou reduzir drasticamente o `useLayoutEffect` que aplica `setProperty(..., 'important')` em `html`, `body` e `#root`.
- Esse tipo de hotfix costuma piorar quando já existe CSS global forte.
- Manter apenas o necessário para visual da página, não para governar scroll do documento inteiro.

4. Deixar a proposta com estrutura full-page limpa
- Manter o wrapper principal como algo simples:
  - `.proposal-page min-h-screen relative overflow-x-hidden`
- Garantir que a página não tenha `overflow-y` próprio.
- Preservar apenas o corte horizontal dos glows/efeitos.

5. Ajustar regras específicas da rota pública
- Se ainda precisar de tratamento especial, usar regras bem objetivas:
  - `html:has(.proposal-page), body:has(.proposal-page), #root:has(.proposal-page) { height: auto; min-height: 100%; overflow-x: hidden; }`
- Evitar misturar `visible`, `auto`, `scroll`, `stable gutter` e inline styles ao mesmo tempo.

6. Verificação visual após implementar
- Confirmar que existe só uma barra vertical real.
- Conferir:
  - hero full width
  - navbar fixa
  - botão flutuante
  - seção com Vimeo
  - desktop e mobile
- Se ainda aparecer “barra extra”, o próximo alvo será esconder/desmontar explicitamente qualquer `ScrollAreaScrollbar` residual apenas na rota pública, mas isso deve ser plano B.

Arquivos que devem entrar na correção:
- `src/App.css`
- `src/index.css`
- `src/features/proposals/components/ProposalPublicPage.tsx`

Detalhes técnicos:
```text
Causa mais provável = combinação de 3 camadas conflitantes:
1) CSS legado do Vite em #root (App.css)
2) CSS global forçando html/body a scrollarem de formas diferentes
3) useLayoutEffect aplicando overrides inline com !important
```

```text
Estratégia correta:
- remover wrapper legado do #root
- definir um fluxo único de scroll
- parar de “brigar” entre CSS global e JS runtime
```
