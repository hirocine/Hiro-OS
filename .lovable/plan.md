
# Corrigir a fidelidade do PDF da proposta

## Resumo
O problema não é só visual: hoje o botão monta o PDF capturando cada filho da `.proposal-page` separadamente e inserindo vários PNGs no `jsPDF`. Por isso o resultado fica com fundo branco entre áreas, cara de “colagem” e pouca fidelidade ao site.

## Melhor caminho
Trocar o export atual por um documento PDF dedicado, usando a mesma identidade visual da página, mas organizado em páginas A4 explícitas e capturado 1 vez por página — não mais 1 vez por seção.

## O que será feito
1. Criar um `ProposalPdfDocument` novo
- Componente offscreen, usado só na exportação.
- Mesmos dados da proposta, mesmas cores, mesma estética.
- Cada página terá fundo preto real e layout pensado para A4.

2. Separar modo web e modo PDF
- Reaproveitar os componentes públicos com um `pdfMode`/`variant="pdf"`.
- No modo PDF:
  - sem animações;
  - sem `mask-image`, blur e hover;
  - sem iframes;
  - com thumbnail estática dos vídeos;
  - com espaçamentos ajustados para papel.

3. Paginar por blocos reais
- Montar páginas com blocos estáveis: hero, clientes, diagnóstico, rows de cases, grupos de entregáveis, investimento, próximos passos e footer.
- Se um bloco não couber, ele vai para a próxima página.
- Entregáveis/cases grandes serão quebrados entre cards/grupos, nunca no meio do card.

4. Refazer o gerador do botão
- `ProposalDownloadButton` vai capturar cada `.proposal-pdf-page` inteira com `html2canvas`.
- Antes de adicionar a imagem no `jsPDF`, cada página será pintada de preto.
- Sai a lógica atual de “várias seções + slices”, que é a causa do efeito de colagem.

5. Garantir assets confiáveis
- Esperar fontes, imagens e thumbs antes de gerar.
- Dar fallback melhor para logos/SVGs problemáticos no PDF.
- No export, vídeo sempre entra congelado em thumb.

## Detalhes técnicos
- O fundo branco acontece porque a página do `jsPDF` continua branca e hoje só recebe imagens por cima.
- A aparência de “imagens coladas” acontece porque o export atual faz `html2canvas(section)` para cada bloco da página.
- As regras de `@media print` quase não ajudam no botão atual, porque ele não usa o fluxo de impressão do navegador; ele usa `html2canvas` no DOM normal.
- Vou parar de depender de print CSS para o download e usar um DOM de exportação explícito e previsível.

## Arquivos principais
- `src/features/proposals/components/public/ProposalDownloadButton.tsx`
- `src/features/proposals/components/public/ProposalPdfDocument.tsx` (novo)
- `src/features/proposals/components/ProposalPublicPage.tsx`
- `src/features/proposals/components/public/ProposalHero.tsx`
- `src/features/proposals/components/public/ProposalClients.tsx`
- `src/features/proposals/components/public/ProposalCases.tsx`
- `src/features/proposals/components/public/ProposalEntregaveis.tsx`
- `src/features/proposals/components/public/ProposalInvestimento.tsx`
- `src/features/proposals/components/public/ProposalProximosPassos.tsx`
- `src/features/proposals/components/public/ProposalFooter.tsx`
- `src/index.css` (somente para estilos do documento PDF)

## Resultado esperado
- fundo preto consistente em todas as páginas;
- PDF com aparência de documento adaptado, não de colagem;
- visual muito mais fiel ao site;
- thumbs de vídeo funcionando no PDF;
- menos bugs de conteúdo sumindo.

## Observação
Se no futuro você quiser um PDF com texto selecionável e fidelidade máxima de HTML/CSS, o caminho ideal seria geração server-side com Chromium. Mas, dentro da arquitetura atual, a melhor solução é este fluxo de documento PDF dedicado + captura por página.
