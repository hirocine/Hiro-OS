

# Reestruturar Tarefas: Pessoais com Multi-Responsável

## Resumo
Transformar a ferramenta de tarefas: remover a divisão "Gerais/Privadas", tornar todas as tarefas pessoais (cada pessoa vê apenas as suas), e permitir múltiplos responsáveis por tarefa.

## Mudanças no Banco de Dados

### 1. Nova tabela `task_assignees`
Tabela de junção para suportar múltiplos responsáveis por tarefa:
```sql
CREATE TABLE public.task_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, user_id)
);
```

RLS: usuários autenticados podem ver assignees de tarefas que criaram ou nas quais estão atribuídos. Inserção/deleção por quem criou a tarefa ou qualquer assignee existente.

### 2. Atualizar RLS da tabela `tasks`
Visibilidade: um usuário vê uma tarefa se:
- Ele a criou (`created_by = auth.uid()`)
- OU ele é um dos responsáveis (`EXISTS em task_assignees`)

Função `security definer` para evitar recursão:
```sql
CREATE FUNCTION public.can_view_task(_user_id uuid, _task_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tasks WHERE id = _task_id AND created_by = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.task_assignees WHERE task_id = _task_id AND user_id = _user_id
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### 3. Migrar dados existentes
Migrar o campo `assigned_to` atual para a nova tabela `task_assignees` (INSERT INTO task_assignees SELECT task_id, assigned_to FROM tasks WHERE assigned_to IS NOT NULL).

## Mudanças no Frontend

### Sidebar (2 arquivos)
- `DesktopSidebar.tsx`, `MobileSidebar.tsx`: Remover `children` do item "Tarefas". Fica apenas `{ name: 'Tarefas', href: '/tarefas', icon: CheckSquare }` sem subitens.

### Rotas (`App.tsx`)
- Remover redirect `/tarefas -> /tarefas/gerais`
- Remover rotas `/tarefas/gerais` e `/tarefas/privadas`
- Manter `/tarefas` apontando para `<Tasks />`
- Manter `/tarefas/:id` para detalhes

### Página principal (`Tasks.tsx`)
- Reescrever removendo a lógica de general/private
- Buscar todas as tarefas do usuário (sem filtro `is_private`)
- Manter tabs: Ativas, Minhas (onde sou responsável), Concluídas, Arquivadas
- Sempre mostrar coluna de responsáveis (agora múltiplos)

### Tipos (`features/tasks/types/index.ts`)
- Adicionar `assignees?: Array<{ user_id: string; display_name: string | null; avatar_url: string | null }>` ao tipo `Task`
- Remover referências a `is_private` dos tipos

### Hook `useTasks.ts`
- Remover filtro `is_private`
- Alterar query para não filtrar por `is_private`
- Fazer join com `task_assignees` + `profiles` para trazer lista de responsáveis

### Hook `useTaskMutations.ts`
- Alterar `createTask` para inserir na `task_assignees` após criar a tarefa
- Alterar `updateTask` para gerenciar assignees via `task_assignees` (insert/delete)
- Remover lógica de `assigned_to` direto na tabela tasks

### Hook `useTaskDetails.ts`
- Fazer join com `task_assignees` para trazer todos os responsáveis

### Componente `InlineAssigneeCell.tsx`
- Transformar de seleção única para multi-seleção
- Mostrar múltiplos avatares empilhados
- Usar checkboxes no dropdown para toggle de responsáveis

### Componente `TaskDialog.tsx`
- Remover switch de "Tarefa Privada"
- Substituir select único de responsável por multi-select
- Remover lógica que bloqueia atribuição quando é privada

### Componente `TasksTable.tsx`
- Remover prop `isPrivate`
- Adaptar coluna de responsável para mostrar múltiplos avatares
- Adaptar criação inline para multi-select

### Página `TaskDetails.tsx`
- Adaptar seção de responsável para mostrar/editar múltiplos
- Remover referências a `is_private`

### Componentes auxiliares
- `TaskCalendarWidget.tsx`: Remover ícone Lock/Users baseado em `is_private`
- `TaskSummaryBar.tsx`: Remover prop `variant` (general/private)
- `TaskSectionCards.tsx`: Remover card de "Tarefas Privadas"
- `QuickActionsCard.tsx`: Remover link para tarefas privadas
- `TaskStatsCards.tsx`: Remover stat de "Privadas"
- `useTaskStats.ts`: Remover contagem de privadas
- `useTaskSectionStats.ts`: Remover lógica de privadas
- `useFilteredTaskStats.ts`: Sem mudanças necessárias

### Página `MyTasks.tsx`
- Pode ser removida ou redirecionada, já que a tab "Minhas" na página principal substitui essa funcionalidade

## Ordem de execução
1. Migration SQL (nova tabela + RLS + migração de dados)
2. Tipos e hooks (backend)
3. Componentes de UI (InlineAssigneeCell, TaskDialog)
4. Páginas (Tasks.tsx, TaskDetails.tsx)
5. Sidebar e rotas
6. Limpeza (remover MyTasks, refs a is_private)

