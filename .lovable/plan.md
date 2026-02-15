

## Padronizar altura de todos os itens da sidebar

### Problema

Os valores de padding vertical estao inconsistentes:
- Itens normais (NavItem): `py-2.5`
- Item pai (Tarefas): `py-2.5`
- Subitens (Gerais, Privadas): `py-3` (maior que os demais)

### Solucao

Reverter os subitens de `py-3` para `py-2.5`, igualando com todos os outros itens. Todos passam a ter `py-2.5`.

### Alteracoes

**`src/components/Layout/DesktopSidebar.tsx`** (linha 176):
- Trocar `py-3` por `py-2.5`

**`src/components/Layout/MobileSidebar.tsx`** (linha ~132):
- Trocar `py-3` por `py-2.5`

### Resultado

Todos os itens da sidebar (normais, pai e subitens) terao exatamente o mesmo padding vertical (`py-2.5`), garantindo altura uniforme.

