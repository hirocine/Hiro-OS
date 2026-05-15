# PENDENTE — Fechar leak público da tabela `orcamentos`

**Status:** rascunho. Nada aplicado. Esperando o upgrade do Postgres terminar
e o Gabriel revisar antes de rodar.

---

## O que é o problema (em humano)

Hoje, qualquer pessoa que pegue a `anon key` do site (ela tá no JavaScript do
navegador, ou seja, **qualquer um consegue abrir o DevTools e copiar**)
consegue mandar uma requisição direto pro Supabase pedindo **todas as
propostas comerciais** — com cliente, valor, briefing, escopo, tudo.

Isso porque as duas regras de segurança da tabela `orcamentos` são:

```
"Allow public read by slug"    → USING (true)
"Anyone can view orcamentos"   → USING (true)
```

`USING (true)` significa "deixa todo mundo ver tudo, sem filtro". O nome
da primeira regra sugere que ela filtraria por slug, mas não filtra — só
o nome dá a entender. Na prática vaza tudo.

---

## O fix proposto

Trocar o acesso direto à tabela por **duas funções no banco** que recebem
o slug (ou parent_id) e devolvem só aquela linha específica:

- `get_proposal_by_slug(slug)` — usado pela página pública pra carregar a
  proposta que o cliente acessou
- `get_latest_proposal_slug(parent_id)` — usado quando a proposta tem uma
  versão mais nova; descobre o slug da última versão pra redirecionar

Depois, **dropo as duas policies públicas** da tabela. A página pública
continua funcionando porque agora chama as funções (que internamente leem
a tabela com privilégio de admin), mas o REST direto da tabela trava com
"permission denied" pra anônimo.

---

## SQL — passo 1 (migration que vai rodar)

```sql
-- 1. Cria a função get_proposal_by_slug
-- SECURITY DEFINER = roda com privilégio do owner (postgres), bypassa RLS.
-- LIMIT 1 garante que só uma linha sai mesmo se houver duplicata.
CREATE OR REPLACE FUNCTION public.get_proposal_by_slug(p_slug text)
RETURNS SETOF public.orcamentos
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.orcamentos
  WHERE slug = p_slug
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_proposal_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_proposal_by_slug(text) TO anon, authenticated;

-- 2. Cria a função get_latest_proposal_slug
CREATE OR REPLACE FUNCTION public.get_latest_proposal_slug(p_parent_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT slug
  FROM public.orcamentos
  WHERE parent_id = p_parent_id
    AND is_latest_version = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_latest_proposal_slug(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_latest_proposal_slug(uuid) TO anon, authenticated;

-- 3. Remove as policies públicas perigosas
DROP POLICY IF EXISTS "Allow public read by slug"   ON public.orcamentos;
DROP POLICY IF EXISTS "Anyone can view orcamentos"  ON public.orcamentos;
```

## Rollback (se algo der errado)

```sql
-- Recria as policies como estavam antes
CREATE POLICY "Allow public read by slug" ON public.orcamentos
  FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can view orcamentos" ON public.orcamentos
  FOR SELECT TO public USING (true);

-- Remove as funções
DROP FUNCTION IF EXISTS public.get_proposal_by_slug(text);
DROP FUNCTION IF EXISTS public.get_latest_proposal_slug(uuid);
```

---

## Patch frontend — passo 2 (depois da migration)

### `src/features/proposals/hooks/useProposalDetailsBySlug.ts`

**Antes** (linhas 10-15):
```ts
const { data, error } = await supabase
  .from('orcamentos')
  .select('*')
  .eq('slug', slug)
  .single();
```

**Depois**:
```ts
const { data, error } = await supabase
  .rpc('get_proposal_by_slug', { p_slug: slug })
  .single();
```

Resto do hook fica idêntico — a função retorna `SETOF orcamentos`, ou seja,
o mesmo shape que `.select('*')` retornava. `.single()` continua válido.

### `src/features/proposals/components/ProposalPublicPage.tsx`

**Antes** (linhas 91-100):
```ts
const parentId = proposal.parent_id || proposal.id;
supabase
  .from('orcamentos')
  .select('slug')
  .eq('parent_id', parentId)
  .eq('is_latest_version', true)
  .maybeSingle()
  .then(({ data }) => {
    if (data) setLatestSlug((data as any).slug);
  });
```

**Depois**:
```ts
const parentId = proposal.parent_id || proposal.id;
supabase
  .rpc('get_latest_proposal_slug', { p_parent_id: parentId })
  .then(({ data }) => {
    if (data) setLatestSlug(data as string);
  });
```

A função retorna `text` direto (o slug), então não precisa de `.maybeSingle()`
nem `.slug` no .then.

---

## Ordem de execução quando o Gabriel der OK

1. Rodar o SQL via Supabase MCP (`apply_migration` com o conteúdo do passo 1)
2. Aplicar os dois patches frontend
3. `npx tsc --noEmit` + `npm run build` pra garantir que compila
4. Reload o preview e abrir uma proposta pública (pegar slug de algum
   orcamento existente, ex.: `os.hiro.film/proposta/<slug>`) pra
   confirmar que carrega
5. Commitar + push: "Secure public proposal access via RPC"

## O que pode quebrar

- **Páginas de proposta pública** caso a função retorne shape diferente.
  Mitigação: `RETURNS SETOF public.orcamentos` espelha exatamente a
  tabela. Risco real: muito baixo.
- **A página de "esta proposta tem versão nova" não conseguir descobrir
  o slug novo**. Mitigação: testar uma proposta com `is_latest_version
  = false` antes de marcar como done.
- **Algum admin que viu orcamentos via REST direto sem login** —
  improvável, mas se existir, vai precisar fazer login. Vale checar no
  Gabriel se há algum dashboard externo.

## Checagem antes de aplicar

Quando o banco voltar, rodar pra confirmar que não há outras policies
inesperadas em `orcamentos`:

```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'orcamentos';
```

Se aparecer alguma policy autenticada `USING (auth.uid() = created_by)`
ou similar — ótimo, deixa quieta. Se aparecer outra `USING (true)` pra
`{public}` que eu não vi, refazer o plano.
