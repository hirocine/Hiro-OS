

# Diagnóstico: Página pública mostrando versão antiga (Service Worker cache)

## Problema encontrado

A página pública da proposta (`/orcamento/:slug`) está exibindo o layout antigo (com `HeroSection`, `UrgencyBar`, grid pattern, "Nº 256", "HIRO FILMS®", "PROPOSTA DE INVESTIMENTO") que **já não existe mais no código atual**.

O código atual está correto -- `ProposalPublicPage` usa o novo `ProposalHero` com bg.png e animações. O problema é o **Service Worker (VitePWA)** que está cacheando a build antiga e servindo assets desatualizados.

## Causa raiz

O projeto usa `VitePWA` com `registerType: 'autoUpdate'` e workbox configurado para cachear `**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff2,woff}`. O navegador do usuário tem um SW ativo com a versão antiga do bundle.

## Solução

### 1. Limpeza imediata (para o usuário)
- Abrir DevTools > Application > Service Workers > "Unregister"
- Hard refresh (Cmd+Shift+R)
- Ou: abrir em aba anônima

### 2. Limpeza de código morto
Remover componentes que não são mais importados em lugar nenhum:
- `src/features/proposals/components/HeroSection.tsx` -- layout antigo do hero (V1)
- `src/features/proposals/components/UrgencyBar.tsx` -- barra amarela de expiração (V1)
- `src/features/proposals/components/ProposalHeader.tsx` -- header antigo (V1)

### 3. Forçar invalidação do cache do SW
Adicionar `version` no `VitePWA` config ou um `skipWaiting` mais agressivo no `vite.config.ts`:

```
workbox: {
  skipWaiting: true,
  clientsClaim: true,
  ...
}
```

Isso garante que novas builds tomem controle imediato do SW sem esperar o reload.

## Arquivos alterados
- `vite.config.ts` -- adicionar `skipWaiting: true` e `clientsClaim: true`
- Deletar 3 componentes mortos (HeroSection, UrgencyBar, ProposalHeader)

