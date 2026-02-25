

# Video Full-Width com Conteúdo no Padding

## Problema

Atualmente o HeroSection está dentro do wrapper `max-w-7xl mx-auto px-6 sm:px-10 lg:px-16`, o que faz o vídeo de fundo ficar limitado a essa largura. No site hiro.film, backgrounds como vídeos e imagens se estendem até as bordas da tela, enquanto o conteúdo textual respeita o padding.

## Solução

Mover o HeroSection para **fora** do wrapper com padding, diretamente no nível raiz da página. O vídeo e overlays já são `absolute inset-0`, então basta que a `<section>` ocupe 100% da largura. O conteúdo textual dentro do Hero já tem seu próprio padding (`px-6 sm:px-10 lg:px-16`), então continuará alinhado.

## Alterações

### `ProposalPublicPage.tsx`

Mover o `<HeroSection>` para antes do wrapper `proposal-content`, ficando como irmão direto do div raiz (fora do max-w-7xl):

```
Antes:
<div className="proposal-content max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
  <HeroSection ... />     ← constrained
  <AboutSection />
  ...
</div>

Depois:
<HeroSection ... />       ← full-width
<div className="proposal-content max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
  <AboutSection />
  ...
</div>
```

Nenhuma alteração no `HeroSection.tsx` — ele já tem padding próprio e o vídeo já é `absolute inset-0`.

## Arquivos

| Arquivo | Alteração |
|---|---|
| `ProposalPublicPage.tsx` | Mover HeroSection para fora do wrapper com padding |

