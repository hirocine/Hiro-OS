
Objetivo: corrigir de vez o desalinhamento de emojis e textos no PDF, agora que o rodapé já voltou a funcionar.

O que a leitura do código mostrou
- O rodapé foi resolvido: `ProposalDownloadButton.tsx` já converte `Asset3.svg` para PNG antes da captura, então essa parte está ok.
- O problema restante está no próprio `ProposalPdfDocument.tsx`: os helpers “PDF-safe” ainda dependem de comportamentos que o `html2canvas` renderiza mal.
- Hoje ainda há pontos frágeis:
  - `PdfCenteredIcon` usa `display: flex` para centralizar SVG;
  - `PdfCheckItem` usa wrapper interno com flex para check/X/quantidade;
  - o círculo do passo atual em `PdfProximosPassos` também centraliza com flex;
  - `PdfBadge` ainda usa `inline-flex`, que pode variar baseline/altura na captura;
  - os emojis vêm direto do conteúdo (`⭐`, `⏰`, `🎬` etc.), então o canvas pode trocar fonte/renderização e “flutuar” dentro da caixa.

Plano de correção
1. Reescrever os helpers do PDF para layout explícito
- Ajustar `PdfCenteredIcon` para usar container `position: relative` e ícone absoluto com `top/left` definidos por pixels, sem depender de flex.
- Ajustar `PdfBadge` para uma pill com altura fixa real, `display: inline-block`, `lineHeight` igual à altura e `textAlign: center`, evitando baseline variável.
- Criar um helper de texto/quantidade centralizado para substituir o conteúdo interno de caixas pequenas (`1x`, `2x`, números, quantidades).

2. Corrigir os itens que ainda usam flex dentro de caixas pequenas
- Aplicar o helper novo em:
  - `PdfCheckItem` (check, X e quantidade);
  - `PdfProximosPassos` no passo “current” (número dentro do círculo);
  - badges de `Incluso/Add-on`, `Recomendado`, desconto e tipo do case.
- Isso padroniza todos os elementos pequenos com fundo, que são justamente os que mais quebram no canvas.

3. Tratar os emojis como conteúdo especial no PDF
- Como o desalinhamento pode continuar mesmo com `line-height`, o caminho mais confiável é não depender do glyph nativo do sistema para o PDF.
- Trocar os emojis do PDF por uma versão mais previsível:
  - opção preferida: mapear os emojis usados (`⭐`, `⏰`, `🎬` e os mais comuns do editor) para equivalentes Lucide quando existir;
  - fallback: renderizar o emoji em uma caixa com altura fixa e `lineHeight` exata, mas sem misturar com flex nem padding interno.
- Assim o PDF fica visualmente estável mesmo se o emoji original no editor continuar livre.

4. Revisar os pontos exatos no arquivo
- `PdfCenteredEmoji`
- `PdfCenteredIcon`
- `PdfBadge`
- `PdfCheckItem`
- `PdfDiagnostico`
- `PdfEntregaveis`
- `PdfProximosPassos`
- `PdfInvestimento`
- `PdfCases`

Resultado esperado
- emojis deixam de “boiar” nas caixas verdes;
- checks, X, quantidades e números ficam centralizados de forma consistente;
- textos dentro de badges/pills ficam corretamente alinhados com o fundo;
- a captura do PDF fica previsível sem depender de flexbox em elementos pequenos.

Detalhe técnico importante
- O rodapé já prova que o pipeline de imagem está funcionando.
- O bug restante não parece mais ser de asset; ele está concentrado em micro-layout e renderização tipográfica do `html2canvas`.
- Se, depois dessa refatoração, algum emoji específico ainda continuar torto, a última camada de robustez é substituir esses emojis por ícones equivalentes apenas no documento PDF, mantendo o site original intacto.
