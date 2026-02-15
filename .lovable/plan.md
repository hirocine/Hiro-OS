

## Mover a linha separadora para entre o logo e a busca

### Alteracao em `src/components/Layout/DesktopSidebar.tsx`

1. **Remover** o `border-b border-border` do container externo do header (linha 125)
2. **Adicionar** `border-b border-border` no bloco do logo (linha 128), para que a linha fique entre o logo e o campo de busca
3. **Ajustar espaçamentos**:
   - Logo: manter `px-4 py-4`
   - Search: trocar `px-3 pb-3` por `px-3 py-3` para ter espaçamento equilibrado acima e abaixo do campo de busca (já que não tem mais border-b no container, o search precisa de padding top e bottom iguais)

### Resultado visual esperado

```text
┌─────────────────────┐
│ [logo] Hiro Hub     │
├─────────────────────┤
│ 🔍 Buscar      ⌘K  │
│                     │
│  Home               │
│  Tarefas            │
│  ...                │
```

A linha separadora fica entre o logo e a busca, criando uma hierarquia visual mais clara: identidade da marca separada das ferramentas de navegação.

