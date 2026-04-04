

# Fix: Emojis/icons desalinhados e arte do rodapé sumindo no PDF

## Causa raiz

Dois problemas distintos:

1. **Emojis e Lucide icons desalinhados**: `html2canvas` renderiza emojis como imagens bitmap e ícones SVG inline de forma inconsistente. O `display: flex` + `alignItems: center` nem sempre funciona na captura. Os emojis ficam "flutuando" fora das caixas verdes.

2. **Arte do rodapé (Asset3.svg) sumindo**: `html2canvas` tem suporte limitado a SVGs referenciados via `<img src="*.svg">`. O arquivo `Asset3.svg` simplesmente não é capturado.

## Solução

### Arquivo: `ProposalPdfDocument.tsx`

**1. Emojis -- trocar por imagem renderizada ou forçar alinhamento**

Nos cards de Diagnóstico (linha 154) e Entregáveis (linhas 234, 253), os emojis estão dentro de um flex container mas o `html2canvas` não respeita o alinhamento vertical. Solução:
- Envolver cada emoji em um `<span>` com `lineHeight` igual à altura do container, `textAlign: center`, `display: block`, `width: 100%`, `height: 100%` -- forçando o bitmap a centralizar
- Adicionar `position: relative` nos containers dos ícones para criar stacking context

**2. Lucide icons (Check, X, Lock) -- forçar dimensões explícitas**

Os ícones SVG do Lucide nas seções "O que está incluso" (PdfCheckItem) e "Próximos Passos" renderizam com offset. Solução:
- Adicionar `display: block` nos ícones Lucide para remover o baseline alignment que causa offset
- Usar `position: absolute` + `top: 50%, left: 50%, transform: translate(-50%,-50%)` nos ícones dentro dos círculos/quadrados para forçar centralização independente do html2canvas

**3. Badges (INCLUSO, ADD-ON, -50%, RECOMENDADO)**

Os badges com `borderRadius: 999` e texto pequeno podem desalinhar. Adicionar `lineHeight: 1` e `display: inline-flex` + `alignItems: center` explícitos.

**4. Footer SVG -- converter referência para PNG ou usar inline SVG**

O `Asset3.svg` não renderiza no `html2canvas`. Duas opções:
- **Opção A (simples)**: Converter o SVG para PNG e referenciar o PNG no PDF document
- **Opção B (melhor)**: Inline o SVG diretamente como JSX no `PdfFooter`, eliminando a dependência de fetch externo

Vou usar a **Opção A**: criar uma versão PNG do logo para o PDF, já que o SVG original pode ser complexo demais para inline.

Se não for possível gerar PNG facilmente, uso **Opção B**: ler o SVG e colá-lo como JSX inline no `PdfFooter`.

### Resumo das mudanças

Todas em `src/features/proposals/components/public/ProposalPdfDocument.tsx`:

1. **PdfDiagnostico** (linha ~154): emoji container com posicionamento absoluto centralizado
2. **PdfEntregaveis** (linhas ~234, ~253): idem para emojis nos cards
3. **PdfCheckItem** (linha ~42-56): ícones Check/X com `display: block`, containers com posicionamento explícito
4. **PdfProximosPassos** (linha ~375-381): ícones Check/Lock com posicionamento absoluto centralizado nos círculos
5. **PdfFooter** (linha ~402): trocar `<img src="Asset3.svg">` por SVG inline ou PNG
6. Badges: adicionar `lineHeight: 1`, `display: inline-flex`

### Resultado esperado
- Emojis centralizados nas caixas verdes
- Ícones Check/X/Lock centralizados nos círculos e quadrados
- Badges alinhados corretamente
- Logo Hiro Films visível no rodapé do PDF

