

## Adicionar animação de entrada nas abas da Administração

### O que será feito

Adicionar uma animação suave de fade-in ao conteúdo de cada aba (Usuários, Logs, Categorias, Notificações, Sistema) ao trocar entre elas.

### Correção

**Arquivo: `src/pages/Admin.tsx`**

Adicionar a classe `animate-fade-in` a cada `TabsContent` existente. A animação já está definida no sistema (300ms ease-out com leve slide vertical).

Serão 5 `TabsContent` atualizados:

- `value="users"` — de `space-y-4` para `space-y-4 animate-fade-in`
- `value="logs"` — de `space-y-4` para `space-y-4 animate-fade-in`
- `value="categories"` — de `space-y-4` para `space-y-4 animate-fade-in`
- `value="notifications"` — de `space-y-4` para `space-y-4 animate-fade-in`
- `value="system"` — de `space-y-4` para `space-y-4 animate-fade-in`

Nenhum arquivo novo ou dependência necessária — a keyframe `fade-in` já existe no Tailwind config do projeto.

