

# Remover subitens "Gerais/Privadas" do menu Tarefas

Os subitens ainda existem na sidebar e nas rotas. Faltou aplicar essa parte do plano anterior.

## Alterações

### 1. `src/components/Layout/DesktopSidebar.tsx` (linhas 29-34)
Remover `children` do item Tarefas e os imports `Users`, `Lock` se não usados em outro lugar. Fica apenas:
```ts
{ name: 'Tarefas', href: '/tarefas', icon: CheckSquare },
```

### 2. `src/components/Layout/MobileSidebar.tsx` (linhas 32-37)
Mesma alteração.

### 3. `src/App.tsx` (linhas 82-84)
Remover redirect `/tarefas -> /tarefas/gerais` e as rotas `/tarefas/gerais` e `/tarefas/privadas`. Manter apenas:
```tsx
<Route path="tarefas" element={<Tasks />} />
<Route path="tarefas/:id" element={<TaskDetails />} />
```

