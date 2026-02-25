

# Cálculo Automático de `contribution_margin_value`

## Contexto

A tabela `financial_snapshots` já possui as colunas `revenue`, `costs_projects` e `contribution_margin_value`. O usuário quer que `contribution_margin_value` seja calculado automaticamente como `revenue - costs_projects`.

## Solução

Criar um trigger `BEFORE INSERT OR UPDATE` que calcula `contribution_margin_value = revenue - costs_projects` automaticamente, similar ao trigger existente `auto_fill_snapshot_revenue_goal`.

## Alterações

### Migration SQL

```sql
CREATE OR REPLACE FUNCTION public.auto_fill_contribution_margin_value()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  NEW.contribution_margin_value := COALESCE(NEW.revenue, 0) - COALESCE(NEW.costs_projects, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_fill_contribution_margin_value
  BEFORE INSERT OR UPDATE OF revenue, costs_projects
  ON public.financial_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_contribution_margin_value();

-- Atualizar dados existentes
UPDATE public.financial_snapshots
SET contribution_margin_value = COALESCE(revenue, 0) - COALESCE(costs_projects, 0);
```

### Edge Function `sync-financial-data`

Remover `contribution_margin_value` do payload de upsert, já que o trigger calcula automaticamente. O campo será ignorado mesmo se enviado, pois o trigger sobrescreve.

### Hook `useFinancialData.ts`

Nenhuma alteração necessária — já lê `contribution_margin_value` do snapshot retornado pelo banco.

## Arquivos

| Arquivo | Alteração |
|---|---|
| Migration SQL | Criar function + trigger + atualizar dados existentes |
| `supabase/functions/sync-financial-data/index.ts` | Remover `contribution_margin_value` do objeto de upsert |

