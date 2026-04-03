

# Fix: Skeleton da página de Orçamentos não aparece corretamente

## Problema
No `Proposals.tsx`, o `PageHeader` real é renderizado **antes** do check `isLoading`, então ele sempre aparece. O skeleton fica abaixo dele — o usuário vê o header real + conteúdo antigo, nunca o skeleton completo.

## Solução
Mover o `isLoading` check para envolver **tudo** (incluindo o PageHeader), de modo que quando estiver carregando, só apareça o `ProposalsPageSkeleton`.

### Arquivo: `src/pages/Proposals.tsx`

Mudar a estrutura de:
```tsx
<ResponsiveContainer>
  <PageHeader ... />        // ← sempre visível
  {isLoading ? (
    <ProposalsPageSkeleton />  // ← skeleton redundante abaixo
  ) : (
    <div>...</div>
  )}
</ResponsiveContainer>
```

Para:
```tsx
{isLoading ? (
  <ProposalsPageSkeleton />    // ← skeleton completo com seu próprio header
) : (
  <ResponsiveContainer>
    <PageHeader ... />
    <div>...</div>
  </ResponsiveContainer>
)}
```

Apenas 1 arquivo editado.

