

# Evitar quebra de conteúdo no PDF da proposta

## Problema

O CSS atual só aplica `break-inside: avoid` em `<section>`, mas dentro das seções existem cards, grids e blocos menores que são cortados no meio ao imprimir. O browser não sabe quais elementos internos devem permanecer inteiros.

## Solução: Granular break-inside rules no Print CSS

Adicionar regras de `break-inside: avoid` para todos os elementos internos que não devem ser cortados:

### Arquivo: `src/index.css` (bloco `@media print`)

Adicionar após as regras existentes de cards/sections:

```css
/* Cards individuais — nunca cortar no meio */
.proposal-page .bg-\\[\\#111\\] {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* Grid rows — evitar corte entre cards de uma mesma linha */
.proposal-page .grid {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* Blocos de entregáveis (cada grupo label+título+grid) */
.proposal-page .flex.flex-col.gap-16 > div {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* Payment option cards */
.proposal-page .rounded-2xl,
.proposal-page .rounded-xl {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* Testimonial block */
.proposal-page .border-l-2 {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* Cases cards */
.proposal-page .aspect-video {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* Glow spots — esconder no print (são decorativos e podem causar overflow) */
.proposal-page .blur-\\[120px\\] {
  display: none !important;
}

/* Iframe de fundo de próximos passos — esconder no print */
.proposal-page .rounded-t-\\[40px\\] iframe {
  display: none !important;
}

/* Seções com overflow hidden podem causar corte — liberar para print */
.proposal-page .overflow-hidden {
  overflow: visible !important;
}

/* Dividers não devem gerar page break sozinhos */
.proposal-page .border-b,
.proposal-page .h-px {
  break-after: avoid;
  page-break-after: avoid;
}
```

### Arquivo: `src/features/proposals/components/public/ProposalEntregaveis.tsx`

Na seção de Entregáveis, os cards de serviços (com checklists longos) podem ser muito grandes para caber numa página. Para esses, permitir break mas forçar que cada `CheckItem` individual não quebre:

- Adicionar `print:break-inside-auto` nos cards de serviços (que têm subcategorias longas)
- Ou melhor: não mudar o componente, apenas confiar no CSS pois o Tailwind `print:` prefix resolve

### Resultado esperado

- Cards de entregáveis, cases e investimento nunca são cortados no meio
- Seções grandes (Entregáveis com muitos cards) podem quebrar entre cards, mas nunca no meio de um card
- Glow spots decorativos removidos no print
- Iframe de vídeo de fundo removido no print
- Overflow liberado para que o browser possa fazer page breaks corretamente

