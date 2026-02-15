

## Mover botão "Adicionar Usuário" para o PageHeader

### Problema
O botão "Adicionar Usuário" está isolado na linha de filtros, abaixo do título. Nas demais páginas (ex: Plataformas), o botão de ação principal fica alinhado com o título no `PageHeader`.

### O que muda

**Arquivo**: `src/pages/Admin.tsx`

1. Adicionar prop `actions` ao `PageHeader`, renderizando o botão "Adicionar Usuário" condicionalmente quando `activeTab === 'users'`
2. Remover o botão da barra de filtros (linha 587-590)
3. A barra de filtros fica apenas com busca + select de role

### Resultado

```text
+----------------------------------------------------------+
| Gerenciamento de Usuários          [+ Adicionar Usuário]  |
| Gerencie usuários e permissões                            |
+----------------------------------------------------------+
| [Buscar usuários...]  [Todos v]                           |
+----------------------------------------------------------+
| Card com tabela                                           |
+----------------------------------------------------------+
```

### Detalhes técnicos

No `PageHeader`, adicionar actions condicional:

```tsx
<PageHeader 
  title={(TAB_HEADERS[activeTab] || TAB_HEADERS.users).title}
  subtitle={(TAB_HEADERS[activeTab] || TAB_HEADERS.users).subtitle}
  actions={activeTab === 'users' ? (
    <Button onClick={() => setIsAddUserDialogOpen(true)}>
      <UserPlus className="h-4 w-4 mr-2" />
      Adicionar Usuário
    </Button>
  ) : undefined}
/>
```

Na barra de filtros, remover o botão e simplificar o layout (remover `justify-between`, manter apenas os filtros).

