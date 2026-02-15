

## Corrigir ausencia de skeleton durante carregamento

### Problema raiz

O `Layout.tsx` usa `<Suspense fallback={null}>`, o que significa que enquanto o chunk JS de qualquer pagina carrega via lazy loading, o usuario ve uma area completamente em branco. Isso afeta **todas** as paginas, nao so Home e Dashboard.

Alem disso:
- **Home**: nao tem skeleton de pagina — cada componente carrega separadamente
- **Dashboard**: o estado `roleLoading` mostra um spinner generico de tela cheia ao inves do skeleton proprio do dashboard

### Solucao (3 mudancas)

#### 1. Layout.tsx — trocar fallback do Suspense

Trocar `fallback={null}` por um skeleton generico leve que aparece apenas enquanto o chunk JS carrega (geralmente < 500ms).

```tsx
// De:
<Suspense fallback={null}>
  <Outlet />
</Suspense>

// Para:
<Suspense fallback={
  <div className="p-6 lg:p-8 space-y-6 animate-pulse">
    <div className="h-8 bg-muted rounded-lg w-1/3" />
    <div className="h-4 bg-muted rounded w-1/2" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="h-40 bg-muted rounded-lg" />
      <div className="h-40 bg-muted rounded-lg" />
      <div className="h-40 bg-muted rounded-lg" />
    </div>
  </div>
}>
  <Outlet />
</Suspense>
```

#### 2. Home.tsx — adicionar skeleton de pagina

A Home nao tem dados globais que determinem um estado `loading`. Mas os sub-componentes (HeroBanner e TeamDirectory) tem seus proprios loadings. Vou extrair os estados de loading dos hooks ja usados e mostrar um skeleton unificado.

Alternativa mais simples: como a Home ja importa os componentes que fazem seus proprios skeletons, e o problema real era o `fallback={null}` do Layout (corrigido acima), a Home ja vai funcionar melhor. Porem, para consistencia visual, vou adicionar um skeleton no nivel da pagina para quando `useSiteSettings` e `useTeamMembers` estao carregando:

```tsx
export default function Home() {
  const { isLoading: bannerLoading } = useSiteSettings();
  const { isLoading: teamLoading } = useTeamMembers();

  if (bannerLoading && teamLoading) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        {/* Banner skeleton */}
        <div className="w-full h-48 md:h-64 lg:h-80 rounded-xl bg-muted animate-pulse" />
        <div className="space-y-6 mt-6">
          {/* AI Assistant skeleton */}
          <div className="h-[220px] bg-muted rounded-lg animate-pulse" />
          {/* Team skeleton */}
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        </div>
      </ResponsiveContainer>
    );
  }
  // ... resto normal
}
```

Obs: Importar `useSiteSettings` e `useTeamMembers` no Home nao cria queries duplicadas — React Query reutiliza a mesma query se a key for igual (ja chamada dentro dos componentes filhos).

#### 3. Dashboard.tsx — unificar roleLoading com skeleton

Trocar o spinner generico de `roleLoading` pelo mesmo skeleton ja existente do estado `loading`:

```tsx
// De:
if (roleLoading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

// Para:
if (roleLoading || loading) {
  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader title="Dashboard" subtitle="..." />
      <div className="space-y-6 lg:space-y-8">
        {/* skeleton existente do dashboard */}
      </div>
    </ResponsiveContainer>
  );
}
```

### Arquivos editados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/Layout/Layout.tsx` | Trocar `fallback={null}` por skeleton generico |
| `src/pages/Home.tsx` | Adicionar skeleton de pagina com hooks de loading |
| `src/pages/Dashboard.tsx` | Unificar `roleLoading` e `loading` no mesmo skeleton |

3 arquivos, nenhuma dependencia nova.

