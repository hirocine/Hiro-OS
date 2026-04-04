
O que eu encontrei no código

- O rodapé ainda está usando SVG, só que em Data URI: `ProposalPdfDocument.tsx` renderiza `<img src={ASSET3_SVG_DATA_URI}>` e `asset3DataUri.ts` continua sendo `data:image/svg+xml`. Ou seja: o problema original do `html2canvas` com SVG em `<img>` não foi realmente removido.
- Os alinhamentos ainda dependem de micro-layouts frágeis para canvas: hoje há vários `translate(-50%, -50%)`, wrappers internos sem `width/height` completos e textos pequenos sem `line-height` fixa. Isso aparece em `PdfCheckItem`, `PdfDiagnostico`, `PdfEntregaveis` e `PdfProximosPassos`.
- Alguns textos com fundo ainda usam pills “soltos” (ex.: `Incluso`, `Add-on`, `-xx%`, `Recomendado`, badge de tipo em cases), então o texto pode ficar visualmente torto dentro do background na captura.

Plano de correção

1. Padronizar os elementos sensíveis ao `html2canvas` em `ProposalPdfDocument.tsx`
- Criar pequenos helpers PDF-only no topo do arquivo para:
  - emoji/texto centralizado: ocupar 100% da caixa + `lineHeight` igual à altura da caixa + `textAlign: center`
  - ícone Lucide centralizado: tamanho explícito + posicionamento absoluto dentro de container `position: relative`
  - badge/pill estável: altura fixa + `inline-flex` + `alignItems/justifyContent` + `whiteSpace: nowrap` + `lineHeight: 1`
- Trocar o markup manual atual por esses helpers em:
  - `PdfDiagnostico`
  - `PdfEntregaveis`
  - `PdfCheckItem`
  - `PdfProximosPassos`

2. Corrigir os textos que estão “fora” do fundo
- Normalizar todos os pills/badges do PDF:
  - badge `Incluso/Add-on`
  - badge de tipo em `PdfCases`
  - badge de desconto e `Recomendado` em `PdfInvestimento`
- Usar altura e alinhamento fixos, em vez de depender só de padding e baseline da fonte.

3. Restaurar a arte do rodapé do jeito confiável
- Parar de usar o SVG atual no `<img>` do PDF.
- Substituir `ASSET3_SVG_DATA_URI` por uma versão raster dedicada ao PDF:
  - preferencialmente um PNG próprio (`Asset3-pdf.png`) ou
  - um PNG Data URI gerado a partir do `Asset3.svg`
- Atualizar `PdfFooter` para usar esse PNG e remover a dependência atual do SVG em Data URI.

Arquivos envolvidos
- `src/features/proposals/components/public/ProposalPdfDocument.tsx`
- `src/features/proposals/components/public/asset3DataUri.ts` (substituir/remover)
- opcionalmente um novo asset PDF-safe em `public/proposal-assets/`

Resultado esperado
- emojis e ícones param de “flutuar” dentro das caixas e círculos
- palavras em badges ficam centralizadas no background
- a arte do rodapé volta a aparecer de forma consistente
- a correção fica estrutural, sem mais remendos pontuais
