

## Mover botao "Nova Tarefa" para dentro do PageHeader

### Problema

Na pagina `Tasks.tsx`, o botao "Nova Tarefa" esta em um `<div>` separado abaixo do `PageHeader`, criando um espaco vazio entre o titulo e o botao. O botao deveria estar alinhado horizontalmente com o titulo, usando a prop `actions` do `PageHeader`.

### Solucao

**Arquivo: `src/pages/Tasks.tsx`**

1. Mover o `<Button>` para a prop `actions` do `PageHeader`
2. Remover o `<div className="flex items-center justify-end">` que envolve o botao

De:
```tsx
<PageHeader
  title={...}
  subtitle={...}
/>

<div className="space-y-6">
  <div className="flex items-center justify-end">
    <Button onClick={() => setDialogOpen(true)}>
      <Plus className="w-4 h-4 mr-2" />
      Nova Tarefa
    </Button>
  </div>
  ...
```

Para:
```tsx
<PageHeader
  title={...}
  subtitle={...}
  actions={
    <Button onClick={() => setDialogOpen(true)}>
      <Plus className="w-4 h-4 mr-2" />
      Nova Tarefa
    </Button>
  }
/>

<div className="space-y-6">
  ...
```

Apenas 1 arquivo editado, nenhuma dependencia nova.
