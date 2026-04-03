
# Corrigir skeleton + loading da proposta pública

## Diagnóstico
O skeleton que você vê na proposta pública não vem da própria `ProposalPublicPage`. Ele vem de dois pontos diferentes:

1. `src/App.tsx`
   - a rota pública `/orcamento/:slug` está lazy-loaded com:
   ```tsx
   <Suspense fallback={<LoadingScreenSkeleton />}>
     <ProposalPublic />
   </Suspense>
   ```
   - esse é exatamente o skeleton genérico que aparece antes da página abrir

2. `src/features/proposals/components/ProposalPublicPage.tsx`
   - depois que o chunk carrega, ainda existe:
   ```tsx
   if (isLoading) {
     return <Loader2 ... />
   }
   ```
   - então o usuário vê o skeleton primeiro e, logo depois, o spinner no meio

## O que vou mudar

### 1. Remover o skeleton da rota pública
**Arquivo:** `src/App.tsx`

Para a rota `/orcamento/:slug`, trocar o fallback do `Suspense`:
- de `LoadingScreenSkeleton`
- para `null`

Isso elimina o skeleton genérico na entrada da proposta pública.

### 2. Remover o spinner central da proposta pública
**Arquivo:** `src/features/proposals/components/ProposalPublicPage.tsx`

Substituir o estado:
```tsx
if (isLoading) { ...Loader2... }
```
por uma renderização silenciosa, para não aparecer loading no meio da tela.

A opção mais limpa aqui é:
```tsx
if (isLoading) return null;
```

## Resultado esperado
Ao abrir a URL pública da proposta:
- não aparece mais o skeleton genérico
- não aparece mais o spinner central
- a página entra direto quando os dados estiverem prontos

## Detalhe técnico
Hoje o fluxo está assim:

```text
Acessa /orcamento/:slug
  -> Suspense mostra LoadingScreenSkeleton
  -> chunk da página carrega
  -> ProposalPublicPage monta
  -> React Query ainda busca os dados
  -> Loader2 aparece no centro
  -> conteúdo final renderiza
```

Depois do ajuste:

```text
Acessa /orcamento/:slug
  -> sem skeleton genérico
  -> sem spinner intermediário
  -> conteúdo aparece direto quando estiver disponível
```

## Arquivos
- `src/App.tsx`
- `src/features/proposals/components/ProposalPublicPage.tsx`
