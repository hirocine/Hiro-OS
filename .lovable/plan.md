

# Remover loading intermediário da página de Orçamentos

## Problema
Ao navegar para `/orcamentos`, o usuário vê brevemente o spinner do `ProtectedRoute` (Loader2 circular) e/ou o skeleton fallback do `Suspense` no `Layout.tsx` (blocos cinza pulsantes). Como `Proposals` já NÃO é lazy-loaded (importado diretamente no App.tsx), o Suspense do Layout não deveria disparar — mas o spinner do ProtectedRoute aparece brevemente toda vez que o auth state está sendo verificado.

## Diagnóstico
- `ProtectedRoute` mostra `Loader2` spinner enquanto `loading` é `true` (verificação de auth)
- `Layout.tsx` tem `Suspense` com skeleton pulse como fallback — dispara para rotas lazy
- Proposals **não é lazy** (linha 37-38 do App.tsx), mas compartilha o mesmo ProtectedRoute/Layout

## Solução
O ProtectedRoute já é necessário para proteger rotas, e o `loading` do auth geralmente resolve muito rápido. Os "skeletons" que o usuário vê são provavelmente o fallback do Suspense no Layout.tsx disparando para **outras rotas lazy vizinhas** durante navegação, ou um flash do ProtectedRoute.

A abordagem mais limpa: remover o skeleton pesado do `Suspense` no Layout e usar um fallback mínimo (div vazia ou null), já que cada página já gerencia seu próprio loading state.

### Mudança

**`src/components/Layout/Layout.tsx`**:
- Trocar o fallback do Suspense de skeleton pulse (header + grid de 3 cards) por `null` — elimina completamente o flash de skeleton entre navegações de páginas lazy

```tsx
// De:
<Suspense fallback={
  <div className="p-6 lg:p-8 space-y-6 animate-pulse">
    <div className="h-8 bg-muted rounded-lg w-1/3" />
    ...
  </div>
}>

// Para:
<Suspense fallback={null}>
```

1 arquivo, 1 mudança simples.

