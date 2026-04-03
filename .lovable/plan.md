

# Fix: quadrados do background iniciam com opacidade máxima

## Problema
O `maskRef` div começa com `style={{ maskImage: 'none' }}`. Em CSS, `mask-image: none` significa **sem máscara** — ou seja, o conteúdo aparece 100% visível. O layer com `opacity-50` dos quadrados fica totalmente visível até o mouse passar e definir o gradiente radial.

## Solução
Mudar o valor inicial do `maskImage` de `'none'` para um gradiente transparente que esconde tudo:

**Arquivo**: `src/features/proposals/components/public/ProposalHero.tsx`

Linha 67 — trocar:
```tsx
style={{ maskImage: 'none', WebkitMaskImage: 'none' }}
```
Por:
```tsx
style={{
  maskImage: 'radial-gradient(circle 0px at 0px 0px, transparent 0%, transparent 100%)',
  WebkitMaskImage: 'radial-gradient(circle 0px at 0px 0px, transparent 0%, transparent 100%)'
}}
```

Isso garante que o layer brilhante dos quadrados comece invisível e só apareça ao mover o mouse — exatamente como o `handleMouseLeave` já faz.

1 arquivo, 1 linha alterada.

