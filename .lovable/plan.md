

## Integracao Financeira Real com Supabase (Intradia + Timestamp de Sincronizacao)

### Resumo

Criar as tabelas `financial_snapshots` e `financial_goals` no Supabase, uma edge function `sync-financial-data` como webhook para o n8n, e atualizar os hooks para buscar dados reais com staleTime curto, suporte a refetch manual, e exibicao do timestamp da ultima sincronizacao.

---

### 1. Migration SQL

**Tabela `financial_snapshots`** -- Dados brutos enviados pelo n8n (pode ter multiplas atualizacoes por dia):

- `id` uuid PK default gen_random_uuid()
- `year` int NOT NULL
- `month` int NOT NULL
- `revenue` numeric default 0
- `revenue_goal` numeric default 0
- `contribution_margin_pct` numeric default 0
- `contribution_margin_value` numeric default 0
- `net_profit_pct` numeric default 0
- `net_profit_value` numeric default 0
- `avg_ticket` numeric default 0
- `cac` numeric default 0
- `ltv` numeric default 0
- `churn_rate` numeric default 0
- `burn_rate` numeric default 0
- `nps` numeric default 0
- `cash_balance` numeric default 0
- `realized_income` numeric default 0
- `realized_expenses` numeric default 0
- `receivables_30d` numeric default 0
- `payables_30d` numeric default 0
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()
- UNIQUE(year, month)

**Tabela `financial_goals`** -- Metas anuais:

- `id` uuid PK default gen_random_uuid()
- `year` int UNIQUE NOT NULL
- `revenue_goal` numeric default 0
- `margin_goal_pct` numeric default 0
- `profit_goal_pct` numeric default 0
- `cac_goal` numeric default 0
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

**RLS**: SELECT para usuarios autenticados, INSERT/UPDATE com `true` (edge function usa service_role).

**Trigger**: `updated_at` automatico via trigger para registrar exatamente quando o n8n atualizou.

---

### 2. Edge Function `sync-financial-data`

- Endpoint POST que o n8n chama via webhook
- Autenticacao via header `x-api-key` contra secret `FINANCIAL_SYNC_API_KEY`
- UPSERT em `financial_snapshots` (ON CONFLICT year+month) -- atualiza o registro do mes a cada chamada
- Aceita campo `goals` opcional para atualizar `financial_goals`
- Usa `createClient` com `SUPABASE_SERVICE_ROLE_KEY` para bypassar RLS
- `verify_jwt = false` no config.toml (autenticacao propria via API key)

---

### 3. Hooks Atualizados

**`useFinancialData`**:
- Busca `financial_goals` (ano corrente) e `financial_snapshots` (ano corrente, ordenado por month)
- staleTime: **60 segundos** (dados quase em tempo real)
- refetchOnWindowFocus: **true** (ao voltar para a aba, busca dados frescos)
- Calcula no frontend: accumulated_revenue_ytd (soma), cash_runway (balance/burn_rate), monthlyData (12 meses)
- Retorna `lastSyncedAt: Date | null` baseado no `updated_at` do snapshot mais recente
- Fallback para mock se nao ha dados no banco

**`useCashFlowData`**:
- Busca snapshots do ano corrente para montar evolucao e dados do mes atual
- Mesmas configs de staleTime/refetchOnWindowFocus
- Retorna `lastSyncedAt` tambem

**`queryClient.ts`**: Adicionar query keys `financial.goals`, `financial.snapshots`.

---

### 4. Dashboard -- Exibicao do Timestamp

O Dashboard ja tem um `lastUpdate` no header. A mudanca e:
- Trocar o `lastUpdate` local (que marca quando o React terminou de carregar) pelo `lastSyncedAt` vindo do hook (que marca quando o n8n realmente enviou dados)
- Exibir "Dados sincronizados ha X minutos" usando `formatRelativeTime`
- Se `lastSyncedAt` for null (sem dados no banco), exibir "Dados de exemplo"

---

### 5. Tratamento de Nulos

- Toda metrica que vier `null` sera tratada como `0` via `?? 0`
- Cash Runway: se burn_rate for 0, exibir `--`
- LTV/CAC: se CAC for 0, exibir `--`
- Valores `NaN` sao impossibilitados pelas verificacoes de divisao por zero

---

### 6. Arquivos a Criar/Editar

| Arquivo | Acao |
|---------|------|
| Migration SQL | Criar 2 tabelas + RLS + trigger updated_at |
| `supabase/functions/sync-financial-data/index.ts` | Criar edge function |
| `supabase/config.toml` | Adicionar `[functions.sync-financial-data]` com verify_jwt = false |
| `src/hooks/useFinancialData.ts` | Reescrever: Supabase + calculos + lastSyncedAt |
| `src/hooks/useCashFlowData.ts` | Reescrever: Supabase + calculos + lastSyncedAt |
| `src/lib/queryClient.ts` | Adicionar query keys financeiras |
| `src/pages/Dashboard.tsx` | Usar lastSyncedAt do hook em vez de lastUpdate local |

### 7. Configuracao Pos-Deploy

O secret `FINANCIAL_SYNC_API_KEY` precisa ser criado no painel do Supabase (Settings > Edge Functions) antes do n8n conseguir autenticar.

