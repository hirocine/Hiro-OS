

# Rodada final de ajustes no PDF: PNG + simplificação dos elementos problemáticos

## O que muda desta vez

Duas mudanças concretas que as rodadas anteriores não fizeram:

1. **Trocar JPEG por PNG** no output final (linha 144 do `ProposalDownloadButton.tsx`). Isso elimina o blur/compressão que apaga micro-elementos. É a mudança mais impactante e nunca foi feita.

2. **Remover o mapeamento emoji→Lucide** que piorou o visual. Voltar a usar emojis nativos, mas com `fontSize` maior e container mais generoso para absorver a variação do `html2canvas`.

## Mudanças específicas

### `ProposalDownloadButton.tsx`
- Linha 144: trocar `canvas.toDataURL('image/jpeg', 0.92)` por `canvas.toDataURL('image/png')`
- Linha 145: trocar `'JPEG'` por `'PNG'` no `addImage`

### `ProposalPdfDocument.tsx`

**Remover `emojiToIcon`** (linhas 17-23) e o branch em `PdfCenteredEmoji` que substitui emoji por ícone (linhas 39-42). Manter apenas o render de emoji nativo com `lineHeight` fixa.

**Aumentar tamanho dos containers de emoji** de 34/36px para 40px com `fontSize` de 20px, dando mais margem para o glyph não vazar.

**`PdfCheckItem`** (linhas 99-118): aumentar `boxSize` de 18 para 22px e `icoSize` de 10 para 14px — os ícones estão sumindo por serem pequenos demais na captura PNG.

**`PdfProximosPassos`** (linhas 441-460): aumentar `circleSize` de 44 para 48px e `iconSize` proporcionalmente.

**Badges**: manter como estão (a mudança para PNG já deve resolver o blur nos textos pequenos).

## Por que pode funcionar desta vez

- A troca para PNG é uma mudança no pipeline de output, não no layout. Remove o artefato de compressão JPEG que borra os detalhes finos.
- O aumento dos containers dá folga real para o `html2canvas` posicionar emojis e ícones, em vez de tentar micro-ajustar CSS que o canvas não respeita.
- A remoção do mapeamento emoji→Lucide desfaz a regressão visual da última rodada.

## Resultado esperado
- Textos e badges mais nítidos (PNG vs JPEG)
- Emojis visíveis e aproximadamente centralizados (containers maiores)
- Ícones check/lock/X visíveis (tamanhos maiores)
- Rodapé continua funcionando (não é alterado)

