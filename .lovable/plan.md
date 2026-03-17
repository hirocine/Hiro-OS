

# Ajuste: contribution_margin_value incluir refund_projects

## Situação Atual
O trigger `auto_fill_contribution_margin_value` calcula:
```
revenue - costs_projects = contribution_margin_value
```

## Alteração
Uma migration que atualiza a função para:
```
revenue - costs_projects + refund_projects = contribution_margin_value
```

E adiciona `refund_projects` à lista de colunas monitoradas pelo trigger.

### Migration SQL
1. `CREATE OR REPLACE FUNCTION auto_fill_contribution_margin_value()` com a nova equação usando `COALESCE(NEW.refund_projects, 0)`
2. `DROP TRIGGER` + `CREATE TRIGGER` para incluir `refund_projects` na cláusula `UPDATE OF`
3. `UPDATE` em massa para recalcular valores existentes

Nenhum arquivo frontend precisa mudar.

