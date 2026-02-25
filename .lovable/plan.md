

# Video de Fundo em Loop na HeroSection

## O que sera feito

Copiar o video MP4 enviado para `public/videos/hero-bg.mp4` e adicionar um elemento `<video>` com `autoPlay`, `muted`, `loop`, `playsInline` como fundo absoluto da HeroSection, com um overlay escuro semi-transparente por cima para manter a legibilidade do texto.

## Alteracoes

### 1. Copiar o video para o projeto

- `user-uploads://Capa_motion_-_Trim_1.mp4` → `public/videos/hero-bg.mp4`
- Usa pasta `public/` porque videos grandes nao devem passar pelo bundler do Vite

### 2. `src/features/proposals/components/HeroSection.tsx`

Adicionar antes dos overlays existentes (green glow, grid pattern):

```tsx
{/* Background video */}
<video
  autoPlay
  muted
  loop
  playsInline
  className="absolute inset-0 w-full h-full object-cover"
>
  <source src="/videos/hero-bg.mp4" type="video/mp4" />
</video>

{/* Dark overlay for readability */}
<div className="absolute inset-0 bg-black/60" />
```

O green glow e grid pattern permanecem por cima do overlay, criando a camada visual: **video → overlay escuro → glow verde → grid → conteudo**.

### Arquivos

| Arquivo | Alteracao |
|---|---|
| `public/videos/hero-bg.mp4` | Novo — video de fundo |
| `HeroSection.tsx` | Adicionar `<video>` e overlay escuro |

