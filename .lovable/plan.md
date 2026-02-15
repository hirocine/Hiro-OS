
## Padronizar containers de busca (Usuários vs Logs)

### Problema
Os containers de filtros das abas Usuários e Logs possuem layouts diferentes:

| Propriedade | Usuarios | Logs |
|---|---|---|
| Container | `flex items-center gap-2` | `flex flex-col md:flex-row gap-3` |
| SelectTrigger | `w-40` | `w-full md:w-[200px]` |
| Search icon | sem `transform` | com `transform` redundante |

### Correção

**Arquivo**: `src/pages/Admin.tsx`

1. **Aba Logs (linha 726)**: Trocar o container de `flex flex-col md:flex-row gap-3` para `flex items-center gap-2` (igual Usuarios)
2. **Aba Logs (linha 737)**: Trocar o SelectTrigger de `w-full md:w-[200px]` para `w-40`
3. **Aba Logs (linha 728)**: Remover `transform` redundante da classe do icone Search

Resultado: ambas as barras de filtro terao exatamente a mesma estrutura e aparencia.
