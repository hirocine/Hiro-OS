

## Eliminar skeleton duplicado: remover Suspense redundante nas rotas filhas

### Problema

Existem duas camadas de `Suspense` para cada rota protegida:

1. **App.tsx** - cada rota filha tem `<Suspense fallback={<LoadingScreenSkeleton />}>` individualmente
2. **Layout.tsx** - o `<Outlet />` ja esta envolto em `<Suspense fallback={null}>`

Quando o usuario navega entre paginas, o fluxo e:
- Suspense do App.tsx mostra `LoadingScreenSkeleton` (generico, tela cheia com 6 blocos identicos) enquanto o chunk JS carrega
- Chunk carrega e a pagina renderiza seu proprio skeleton inline (fiel ao layout)

Resultado: **flash do skeleton generico seguido pelo skeleton da pagina** — dois skeletons em sequencia.

### Solucao

Remover os wrappers `<Suspense>` individuais de todas as rotas filhas do Layout no `App.tsx`. O `<Suspense fallback={null}>` do `Layout.tsx` ja cuida do lazy loading — quando o chunk carrega, o Suspense do Layout mostra `null` (nada), e em seguida a pagina renderiza seu proprio skeleton de loading (que ja espelha o layout real).

Manter o `<Suspense>` apenas nas rotas que nao sao filhas do Layout:
- `/entrar` (Auth) — nao tem Layout
- `*` (NotFound) — nao tem Layout

### Mudanca no App.tsx

De:
```tsx
<Route index element={<Suspense fallback={<LoadingScreenSkeleton />}><Home /></Suspense>} />
<Route path="dashboard" element={<Suspense fallback={<LoadingScreenSkeleton />}><Dashboard /></Suspense>} />
// ... 20+ rotas iguais
```

Para:
```tsx
<Route index element={<Home />} />
<Route path="dashboard" element={<Dashboard />} />
// ... rotas diretas, sem Suspense individual
```

As rotas fora do Layout mantem o Suspense:
```tsx
<Route path="/entrar" element={
  <Suspense fallback={<LoadingScreenSkeleton />}>
    <Auth />
  </Suspense>
} />
<Route path="*" element={
  <Suspense fallback={<LoadingScreenSkeleton />}>
    <NotFound />
  </Suspense>
} />
```

### Arquivos editados

- `src/App.tsx` — remover Suspense wrappers de ~25 rotas filhas do Layout

Nenhum outro arquivo precisa mudar. Nenhuma dependencia nova.

### Resultado

- Navegacao entre paginas: usuario ve apenas 1 skeleton (o da pagina, fiel ao layout real)
- Primeiro carregamento (chunk nao cacheado): Layout mostra nada (`null`) por alguns ms enquanto o chunk carrega, depois a pagina mostra seu skeleton proprio
- Rotas externas (Auth, NotFound): mantem o Suspense generico como fallback

