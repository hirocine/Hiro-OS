

# Corrigir reflow de texto na proposta pública (font swap)

## Problema

A fonte "Helvetica Now Display" carrega de forma assíncrona com `font-display: swap`. Isso faz o browser renderizar primeiro com a fallback (Inter/sans-serif), e quando a fonte custom carrega, o texto "pula" porque as métricas são diferentes. Esse é o efeito que você vê — textos se ajustando/diminuindo após o carregamento.

## Solução

Duas ações complementares:

### 1. Preload das fontes no `index.html`
Adicionar `<link rel="preload">` para os arquivos .otf mais usados (Bold e Medium) no `<head>`. Isso faz o browser baixar as fontes **antes** de renderizar, eliminando o swap visível na maioria dos casos.

```html
<link rel="preload" href="/fonts/HelveticaNowDisplay-Bold.otf" as="font" type="font/otf" crossorigin>
<link rel="preload" href="/fonts/HelveticaNowDisplay-Medium.otf" as="font" type="font/otf" crossorigin>
```

### 2. Trocar `font-display: swap` por `font-display: block` nas @font-face
Em `src/index.css`, mudar as 4 declarações de `font-display: swap` para `font-display: block`. Isso faz o browser esperar pela fonte (até ~3s) em vez de mostrar a fallback e depois trocar. Como as fontes serão preloaded, o bloqueio será imperceptível.

### Arquivos
- `index.html` — adicionar 2 linhas de preload no head
- `src/index.css` — trocar `swap` por `block` nas 4 @font-face

