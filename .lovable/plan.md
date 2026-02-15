

## Corrigir altura do SelectTrigger no componente base

### Causa raiz

O arquivo `src/components/ui/select.tsx` define `min-h-[44px]` no `SelectTrigger` (linha 21). O `Input` usa `h-10` (40px). Como `min-height` tem prioridade sobre `height`, adicionar `h-10` individualmente nao resolve -- o select continua com 44px.

### Correção

**Arquivo: `src/components/ui/select.tsx`**

- Linha 21: Trocar `min-h-[44px]` por `h-10` no SelectTrigger base

Isso padroniza todos os selects do sistema para 40px, igualando ao Input.

**Arquivo: `src/pages/Admin.tsx`**

- Remover os `h-10` manuais adicionados anteriormente nos SelectTriggers das abas Usuarios e Logs, pois nao serao mais necessarios.

### Resultado

Todos os inputs e selects terao exatamente 40px de altura em todo o sistema, sem necessidade de overrides manuais.

### Secao tecnica

A propriedade CSS `min-height` prevalece sobre `height` quando `min-height > height`. Por isso `h-10` (40px) era ignorado quando `min-h-[44px]` (44px) estava presente. A correção no componente base elimina o conflito na origem.

