

# Corrigir Alinhamento do Conteúdo do HeroSection

## Problema

O HeroSection foi movido para fora do wrapper `max-w-7xl mx-auto`, o que é correto para o vídeo de fundo ir até as bordas. Porém, o conteúdo textual (número do projeto, nome do cliente, metadados) agora não tem `max-w-7xl mx-auto` limitando sua largura — ele se espalha por toda a tela usando apenas o padding `px-6 sm:px-10 lg:px-16` da section.

Para alinhar com o resto da página, o conteúdo interno precisa estar dentro de um wrapper `max-w-7xl mx-auto` enquanto o fundo (vídeo, overlays) continua full-width.

## Solução

No `HeroSection.tsx`, mover o padding horizontal da `<section>` para um wrapper interno com `max-w-7xl mx-auto`, mantendo a section com largura total para o vídeo.

### `HeroSection.tsx`

**Section**: Remover `px-6 sm:px-10 lg:px-16` da section (manter apenas layout/spacing vertical).

**Adicionar wrapper interno** que envolve todo o conteúdo (top bar, client name, bottom section) com `max-w-7xl mx-auto px-6 sm:px-10 lg:px-16` + `relative z-10 flex flex-col justify-between h-full min-h-screen`.

Os backgrounds (video, overlay, glow, grid) ficam na section (full-width), e o conteúdo fica dentro do wrapper centralizado.

```
section (full-width, min-h-screen, relative, overflow-hidden)
  ├── video (absolute inset-0) ← full-width
  ├── overlay escuro (absolute inset-0) ← full-width
  ├── glow verde (absolute inset-0) ← full-width
  ├── grid pattern (absolute inset-0) ← full-width
  └── div.max-w-7xl.mx-auto.px-6... (conteúdo alinhado)
       ├── top bar
       ├── client name
       └── bottom section (metadata + footer)
```

## Arquivo

| Arquivo | Alteração |
|---|---|
| `HeroSection.tsx` | Mover padding para wrapper interno com max-w-7xl mx-auto |

