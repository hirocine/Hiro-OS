

## Titulo dinamico no header da pagina Admin

### O que muda

O `PageHeader` vai mostrar o titulo e subtitulo especificos de cada sub-ferramenta (ex: "Gerenciamento de Usuarios" / "Visualize e gerencie roles dos usuarios do sistema") em vez do generico "Administracao".

### Detalhes tecnicos

**Arquivo**: `src/pages/Admin.tsx`

1. Criar um mapa de titulos/subtitulos por tab:

```tsx
const TAB_HEADERS: Record<string, { title: string; subtitle: string }> = {
  users: { title: 'Gerenciamento de Usuários', subtitle: 'Visualize e gerencie roles dos usuários do sistema' },
  logs: { title: 'Logs de Auditoria', subtitle: 'Monitore todas as atividades do sistema' },
  categories: { title: 'Gerenciamento de Categorias', subtitle: 'Gerencie categorias e subcategorias de equipamentos' },
  notifications: { title: 'Notificações do Sistema', subtitle: 'Configure notificações e alertas do sistema' },
  system: { title: 'Configurações do Sistema', subtitle: 'Gerencie configurações gerais do sistema' },
};
```

2. Usar `activeTab` (ja existente) para derivar o header dinamico:

```tsx
const currentHeader = TAB_HEADERS[activeTab] || TAB_HEADERS.users;
```

3. Atualizar o `PageHeader`:

```tsx
<PageHeader 
  title={currentHeader.title} 
  subtitle={currentHeader.subtitle}
/>
```

4. Opcionalmente, remover os `CardTitle`/`CardDescription` duplicados dos `Card` dentro de cada `TabsContent`, ja que o titulo agora aparece no `PageHeader`. (Os subtitulos exatos serao extraidos do conteudo atual dos `CardHeader` de cada tab.)

### Resultado

- Navegar para `/administracao/usuarios` mostra "Gerenciamento de Usuarios" no header
- Navegar para `/administracao/logs` mostra "Logs de Auditoria" no header
- E assim por diante para cada subitem

