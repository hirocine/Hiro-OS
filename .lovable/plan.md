

# PDF da Proposta Igual ao Site

## Resumo

Transformar o PDF gerado (botão "Baixar PDF") para que mantenha o visual escuro e estilizado do site, incluindo imagens e thumbnails de vídeos no lugar dos iframes.

## Abordagem escolhida: Print CSS avançado

Existem 3 caminhos possíveis:

| Abordagem | Fidelidade | Complexidade | Peso do PDF |
|-----------|-----------|-------------|-------------|
| **Print CSS (dark mode)** | Alta | Baixa | Leve, texto selecionável |
| html2canvas + jsPDF | Muito alta | Média | Pesado (imagens rasterizadas) |
| Puppeteer (Edge Function) | Perfeita | Alta | Requer infra servidor |

**Print CSS é a melhor opção**: o PDF É literalmente o site impresso, mantendo fontes, cores, layout. Texto continua selecionável, arquivo leve, zero dependências novas.

## Alterações

### 1. Print CSS completo em `src/index.css`

Substituir o bloco `@media print` atual (que tenta forçar fundo branco) por um que preserve o tema escuro:

- `background: black`, `color: #f5f5f5` em body e `.proposal-page`
- `-webkit-print-color-adjust: exact` + `print-color-adjust: exact` para forçar backgrounds
- Esconder: navbar, botão download/WhatsApp, scroll indicator, animated gradients, glow spots
- Cards `bg-[#111]` e borders preservados
- Forçar `opacity: 1` e `transform: none` em todos os elementos animados (evitar que fiquem invisíveis no print)
- Page breaks: `break-inside: avoid` em cards e seções, `break-before: page` antes de seções grandes (Entregáveis, Investimento, Próximos Passos)
- Remover padding lateral excessivo para melhor uso do papel
- Esconder o carousel infinito de logos (InfiniteSlider) e mostrar uma versão estática em grid

### 2. Thumbnails de vídeo para Cases (`ProposalCases.tsx`)

Para cada case com `vimeoId`, adicionar uma tag `<img>` com a thumbnail do Vimeo:
- URL: `https://vumbnail.com/{vimeoId}.jpg` (serviço público de thumbnails Vimeo)
- A imagem fica `hidden` na tela (`hidden print:block`) e o iframe fica `print:hidden`
- Resultado: no PDF aparece a thumbnail estática do vídeo em vez de um retângulo vazio

### 3. Thumbnail no vídeo de fundo de Próximos Passos (`ProposalProximosPassos.tsx` / `ProposalPublicPage.tsx`)

O iframe do Vimeo na seção de Próximos Passos também precisa de fallback:
- Adicionar `print:hidden` no container do iframe
- O gradiente escuro já garante que a seção fique bonita sem o vídeo

### 4. Logo dos clientes em versão estática (`ProposalClients.tsx`)

O carousel infinito não funciona em print. Adicionar um grid estático dos logos:
- `hidden print:grid grid-cols-6 gap-6` com os logos
- `print:hidden` no InfiniteSlider

### 5. Hero: garantir visibilidade

Os elementos do Hero usam CSS animations com `opacity: 0` inicial. No print, forçar `opacity: 1 !important` e `transform: none !important` para que tudo apareça.

## Seções do site que aparecerão no PDF

1. **Hero** - Nome do projeto, cliente, datas (sem bg animado)
2. **Clientes** - Grid estático de logos
3. **Diagnóstico** - Objetivo + cards de dores
4. **Cases** - Grid com thumbnails dos vídeos
5. **Entregáveis** - Cards com ícones e checklists
6. **Investimento** - Valores, opções de pagamento, depoimento
7. **Próximos Passos** - Timeline com steps
8. **Footer** - Contato e logo Hiro

