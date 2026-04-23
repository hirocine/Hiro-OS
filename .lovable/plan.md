

# Passo 1 — Execução: modelo de dados + zod + template + testes

Modo atual é read-only. Aprovando este plano, mudo pra default e executo tudo abaixo de uma vez. Tabela confirmada: `orcamentos`. Vitest já configurado (`npx vitest run`). Zod 3.23 disponível.

## Ações

### 1. Migration Supabase
Criar migration adicionando `services JSONB` (nullable, sem default) em `orcamentos`. Sem CHECK constraint. Sem migration de dados (propostas antigas ficam `null` → fallback no passo 2). Aplicada automaticamente pela ferramenta de migration.

### 2. `src/lib/services-schema.ts`
Zod schema com `phaseIdSchema`, `serviceItemSchema`, `subcategorySchema`, `phaseSchema`, `proposalServicesSchema` (com `superRefine` validando ordem fixa das 3 fases e ordem fixa Equipe→Equipamentos→Produção dentro de gravacao). Tipos inferidos exportados.

### 3. `src/lib/services-template.ts`
`createDefaultServices()` retornando estrutura completa (3 + 10 + 5 + 1 + 7 = 26 itens) com `crypto.randomUUID()` por item. Defaults: `included:false, isCustom:false, specification:"", quantity:1, enabled:true`.

### 4. Testes
- `src/lib/__tests__/services-schema.test.ts` (6 cases): aceita default; rejeita ordem errada de fases; rejeita ordem errada de subcats em gravacao; rejeita quantity<1; rejeita id não-uuid; rejeita número errado de fases.
- `src/lib/__tests__/services-template.test.ts` (8 cases): 3 fases na ordem certa; pré/pós com 1 subcat name=null; gravacao com 3 subcats na ordem certa; total 26 itens; defaults corretos por item; enabled=true por fase; IDs distintos entre calls; passa pelo `proposalServicesSchema.parse`.

### 5. Verificação final
- Rodar `npm run build` → reportar status.
- Rodar `npx vitest run src/lib/__tests__/services-schema.test.ts src/lib/__tests__/services-template.test.ts` → reportar nº de testes/status.

## Não inclui
Nenhuma alteração em UI, hooks, types do módulo proposals, ou wizard. Re-export de tipo em `src/features/proposals/types/index.ts` foi adiado pro passo 2 pra manter este passo 100% isolado em `src/lib/`.

## Resumo que vou enviar ao terminar
1. Caminho da migration criada
2. Confirmação de aplicação automática no Supabase
3. Output do `npm run build`
4. Output do `vitest run` (nº de testes + status)

Aguardo seu OK antes de seguir pro passo 2.

