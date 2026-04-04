
Diagnóstico definitivo

- A rota pública não está apontando para o componente errado.
- Em `src/App.tsx`, existe só uma rota pública de proposta: `/orcamento/:slug`, e ela renderiza `ProposalPublicPage`.
- `src/features/proposals/components/ProposalPublicPage.tsx` já é a V2.
- Os botões "Ver Proposta" abrem URL relativa (`/orcamento/${proposal.slug}`), então não estão mandando para outro projeto/domínio.
- A busca no código não encontrou os textos da V1 ("Proposta de Investimento", "HIRO FILMS®", etc.) no fluxo atual.
- Mas o comportamento observado fecha assim:
  - o Preview URL hoje responde com a V2;
  - o domínio publicado ainda responde com a V1;
  - seu screenshot mostrou a V1 até no preview.
- Conclusão: o problema é de build/cache antigo sendo servido em alguns contextos, muito provavelmente por PWA/service worker + cache de navegação. Não é problema da query do Supabase.

Plano de correção definitiva

1. Parar de cachear a proposta pública como página navegável
- Em `vite.config.ts`, remover/restringir o runtime cache genérico de páginas (`/^\/.*$/`).
- Excluir `/orcamento/*` do cache de navegação ou tratar como `NetworkOnly`.

2. Controlar o Service Worker manualmente
- Parar o registro automático do PWA.
- Em `src/main.tsx`, registrar SW só no domínio publicado e nunca em preview/iframe.
- Manter a limpeza de SW/caches no preview antes da aplicação montar.

3. Forçar abertura “fresh” no preview
- Em `ProposalCard.tsx`, `ProposalDetails.tsx` e `ProposalWizard.tsx`, ao abrir "Ver Proposta" no preview, anexar um cache-buster temporário na URL.
- Em produção publicada, manter o link limpo para o cliente.

4. Eliminar o legado que confunde o build
- Remover/arquivar os componentes V1 hoje não usados:
  - `AboutSection.tsx`
  - `BriefingSection.tsx`
  - `InvestmentSection.tsx`
  - `ScopeSection.tsx`
  - `ShowcaseSection.tsx`
  - `TimelineSection.tsx`
  - `FloatingActions.tsx`

5. Adicionar prova visual de versão
- Em `ProposalPublicPage.tsx`, inserir um `data-proposal-version="v2"`.
- No preview, exibir um marcador discreto temporário de versão para confirmar imediatamente qual build carregou.

Validação
- Abrir "Ver Proposta" a partir de `/orcamentos` no preview deve sempre mostrar a V2.
- Abrir o link público direto em nova aba também deve abrir V2.
- Hard refresh, aba anônima e retorno pelo histórico não podem mais trazer a V1.
- Depois de publicar novamente, o domínio publicado precisa ficar idêntico ao preview.

Detalhes técnicos
- Arquivos principais:
  - `vite.config.ts`
  - `src/main.tsx`
  - `src/features/proposals/components/ProposalCard.tsx`
  - `src/pages/ProposalDetails.tsx`
  - `src/features/proposals/components/ProposalWizard.tsx`
  - `src/features/proposals/components/ProposalPublicPage.tsx`
- Causa mais provável: o cache de navegação do PWA está permitindo que uma build antiga continue controlando a rota pública da proposta.
