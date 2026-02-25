

# Replicar TopBar do hiro.film na Proposta

## Contexto

O usuario quer que o `ProposalHeader` replique exatamente o header do site hiro.film. Ele tambem forneceu o SVG oficial do logo (Asset_10-2.svg com "HIROヒロシ" em branco e verde).

## Alteracoes

### 1. Copiar o novo logo SVG para o projeto

Copiar `user-uploads://Asset_10-2.svg` para `src/assets/hiro-logo-full.svg` (substituindo o atual).

### 2. Atualizar `ProposalHeader.tsx`

Reescrever o componente para replicar exatamente o header do hiro.film:

- **Fundo**: Transparente com backdrop-blur (sem o fundo solido `#0A0A0A/95`), posicionado fixo no topo logo abaixo da UrgencyBar
- **Logo**: Usar o novo SVG importado, sem filtros de `brightness-0 invert` (o SVG ja tem as cores corretas branco + verde)
- **Links de navegacao**: "Sobre nos", "Cases" com hover suave (opacity transition)
- **Icone Instagram**: Verde neon `#4CFF5C` (ja existe)
- **Botao "Contato"**: Pill com borda branca/20, hover bg-white/10 (ja existe)
- **Mobile**: Adicionar menu hamburger que abre um menu mobile com os links

### 3. Estrutura do Header

```text
┌──────────────────────────────────────────────────┐
│  [HIROヒロシ®]          Sobre nós  Cases  🟢  [Contato]  │
│  (logo SVG)            (links)    (IG)  (pill btn)      │
└──────────────────────────────────────────────────┘

Mobile:
┌──────────────────────────────┐
│  [HIROヒロシ®]          [≡]  │
└──────────────────────────────┘
  → Menu abre overlay com links
```

### 4. Detalhes de estilo

- Header: `fixed top-[37px]` (abaixo da UrgencyBar), fundo `bg-black/80 backdrop-blur-md`
- Logo: altura `h-5 sm:h-6`, sem filtros de cor
- Links: `text-sm text-white/60 hover:text-white transition-colors duration-300`
- Botao Contato: `border border-white/20 rounded-full px-5 py-1.5`
- Instagram: `text-[#4CFF5C]`
- Mobile: Botao hamburger visivel em `sm:hidden`, links escondidos com `hidden sm:flex`
- Menu mobile: Overlay fullscreen com links empilhados verticalmente

### 5. Sobre o Hero Section

O Hero Section da proposta mantem seu layout atual (nome do cliente em tipografia gigante, metadados, video de fundo). O pedido de replicar o hero do hiro.film ("No marketing digital...") nao se aplica aqui pois a proposta tem seu proprio conteudo dinamico. Nenhuma alteracao no HeroSection.

## Arquivos

| Arquivo | Alteracao |
|---|---|
| `src/assets/hiro-logo-full.svg` | Substituir pelo novo SVG (Asset_10-2.svg) |
| `src/features/proposals/components/ProposalHeader.tsx` | Reescrever com layout exato do hiro.film + menu mobile hamburger |

