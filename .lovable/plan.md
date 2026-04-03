

# Adicionar fade-in escalonado nos elementos do Hero da proposta

## O que muda

**`src/features/proposals/components/public/ProposalHero.tsx`**:

Adicionar animação de fade-in com delay escalonado nos 5 elementos principais do hero:

1. Tag "Proposta Comercial 2026" — delay 0ms
2. Título (h1) — delay 150ms
3. Descrição (p) — delay 300ms
4. Linha verde — delay 450ms
5. Info items (Cliente, Data, Validade) — delay 600ms

Cada elemento começa com `opacity: 0` e `translateY(20px)`, e anima para `opacity: 1` e `translateY(0)` usando CSS inline com `animation` + `animation-delay` + `animation-fill-mode: forwards`.

Vou adicionar uma classe CSS utilitária no `index.css` para o keyframe (ou usar inline styles), e aplicar delays incrementais em cada bloco. Abordagem com inline styles para manter tudo no componente sem precisar de classes extras:

```tsx
const fadeUp = (delay: number) => ({
  opacity: 0,
  animation: `proposal-fade-up 0.8s ease-out ${delay}ms forwards`,
})
```

E um `@keyframes proposal-fade-up` no CSS das propostas (já existe seção de proposal styles no `index.css`).

## Arquivos
- `src/index.css` — adicionar 1 keyframe `proposal-fade-up`
- `src/features/proposals/components/public/ProposalHero.tsx` — aplicar styles nos 5 elementos

