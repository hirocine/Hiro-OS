

# Diagnóstico: alterações não aparecem em `os.hiro.film/orcamento/...`

## Causa
O código do `ProposalEntregaveis.tsx` está correto no repositório (layout 2 colunas já aplicado). O problema **não é de código** — é de **deploy + cache**:

1. **`os.hiro.film` é o domínio publicado** (produção). Edições feitas no editor da Lovable rodam no **preview** (`id-preview--*.lovable.app`). Para a versão pública refletir as mudanças, é necessário **republicar** o projeto pelo botão Publish da Lovable.

2. **Service Worker PWA**: mesmo após republicar, o navegador pode estar servindo a build anterior do cache. A rota `/orcamento/*` está com `NetworkOnly` (ok), mas o **index.html + bundle JS** caem na regra genérica `^/.*$` com `NetworkFirst` (TTL 2h). O parâmetro `?v=...` na URL não invalida isso porque o cache key é baseado no caminho do bundle, não da rota.

## Ação recomendada (sem mudança de código)
1. Clicar em **Publish** no canto superior direito da Lovable para republicar `os.hiro.film` com a build atual.
2. Aguardar ~30 segundos.
3. Abrir `https://os.hiro.film/orcamento/546-...` em **aba anônima** (ou Cmd+Shift+R) para forçar bypass do service worker.

## Verificação
Se mesmo após republicar + hard reload o layout antigo persistir, o problema é cache do SW. Nesse caso a correção de código seria:

- Adicionar `/orcamento/` ao `navigateFallbackDenylist` no `vite.config.ts`, garantindo que o HTML dessas páginas nunca seja interceptado pelo SW.
- Forçar `cacheName: 'pages-v2'` (renomear) para invalidar caches antigos em clientes existentes.

## Próximo passo
Por favor, republique pelo botão Publish e teste em aba anônima. Se ainda não aparecer, me avise que aplico a correção do `vite.config.ts` para blindar a rota pública de cache do SW.

