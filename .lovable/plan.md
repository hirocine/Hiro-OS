

## Adicionar subitens de Administracao na sidebar

### O que muda

O item "Admin" na sidebar vai virar um menu expansivel (igual Fornecedores e Tarefas), com 5 subitens correspondendo as abas da pagina:

- Usuarios (`/administracao/usuarios`)
- Logs de Auditoria (`/administracao/logs`)
- Categorias (`/administracao/categorias`)
- Notificacoes (`/administracao/notificacoes`)
- Sistema (`/administracao/sistema`)

### Detalhes tecnicos

**1. Rotas (App.tsx)**

Adicionar sub-rotas para cada aba e um redirect da rota pai:

```
/administracao        -> redireciona para /administracao/usuarios
/administracao/usuarios
/administracao/logs
/administracao/categorias
/administracao/notificacoes
/administracao/sistema
```

**2. Sidebar (DesktopSidebar.tsx e MobileSidebar.tsx)**

Transformar o item "Admin" de item simples para item com `children`:

```
{
  name: 'Admin', href: '/administracao', icon: Settings, adminOnly: true,
  children: [
    { name: 'Usuarios', href: '/administracao/usuarios' },
    { name: 'Logs de Auditoria', href: '/administracao/logs' },
    { name: 'Categorias', href: '/administracao/categorias' },
    { name: 'Notificacoes', href: '/administracao/notificacoes' },
    { name: 'Sistema', href: '/administracao/sistema' },
  ],
}
```

Os subitens terao o mesmo estilo vermelho (`text-destructive`) dos outros itens admin, com pontinho no lugar do icone.

**3. Pagina Admin (Admin.tsx)**

Extrair o tab ativo da URL em vez de usar `defaultValue="users"`. O componente vai ler o ultimo segmento da rota (ex: `/administracao/logs` -> `logs`) e usar como `value` controlado do `Tabs`. Ao trocar de aba, navega para a sub-rota correspondente. Os valores dos tabs serao mapeados:

- `/administracao/usuarios` -> tab `users`
- `/administracao/logs` -> tab `logs`
- `/administracao/categorias` -> tab `categories`
- `/administracao/notificacoes` -> tab `notifications`
- `/administracao/sistema` -> tab `system`

### Arquivos editados

- `src/App.tsx` - Novas sub-rotas + redirect
- `src/components/Layout/DesktopSidebar.tsx` - Admin com children
- `src/components/Layout/MobileSidebar.tsx` - Admin com children
- `src/pages/Admin.tsx` - Tabs controlados pela URL
