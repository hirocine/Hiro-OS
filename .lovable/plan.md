

## Padronizar caixas de busca na Administração

### Problema
As 3 caixas de busca (Usuários, Categorias, Logs) usam posicionamentos de ícone e padding diferentes, resultando em aparência inconsistente.

### Diferenças atuais

| Aba | Ícone (posição) | Input (padding) |
|---|---|---|
| Usuários | `left-2 top-2.5` | `pl-8` |
| Categorias | `left-3 top-3` | `pl-9` |
| Logs | `left-3 top-1/2 -translate-y-1/2` | `pl-10` |

### Padrão escolhido

Usar `left-3 top-1/2 -translate-y-1/2` para o ícone e `pl-10` para o input. Esse padrão centraliza o ícone verticalmente de forma confiável independente da altura do input.

### O que muda

**Arquivo 1**: `src/pages/Admin.tsx`
- Aba Usuários (linha ~580): ajustar ícone para `left-3 top-1/2 -translate-y-1/2` e input para `pl-10`

**Arquivo 2**: `src/components/Settings/CategoryManagement.tsx`
- Busca de categorias (linha ~583): ajustar ícone para `left-3 top-1/2 -translate-y-1/2` e input para `pl-10`

A aba de Logs já está no padrão correto, não precisa de alteração.

