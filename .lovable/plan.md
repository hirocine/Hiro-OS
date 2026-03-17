
# Ajustes na Esteira de Pós

## Alterações

### 1. `src/pages/PostProduction.tsx`
- Adicionar botão "Novo Vídeo" na prop `actions` do `PageHeader` (padrão da plataforma)
- Adicionar estado `createDialogOpen` para controlar o dialog de criação
- Renderizar o `PPDialog` tanto para criação (item=null) quanto edição

### 2. `src/features/post-production/components/PPDialog.tsx`
- Suportar modo criação (quando `item` é null): título "Novo Vídeo", botão "Criar" em vez de "Salvar", sem botão Excluir
- Chamar `createItem` do mutations quando em modo criação

### 3. `src/features/post-production/components/PPTable.tsx`
- **Remover** toda a creation row (linhas 154-212)
- **Remover** imports não mais necessários (`defaultNewItem`, estado `newItem`, `handleCreate`, `isActive`)
- Título e Projeto/Cliente: trocar `InlineEditCell` por texto estático (span simples)
- **Adicionar coluna "Ações"** no final com um botão de edição (ícone `Pencil`) que abre o dialog de edição
- Receber callback `onEditClick` via props para abrir o dialog de edição
- Ajustar larguras das colunas para acomodar a nova coluna de ações

### 4. `src/pages/PostProduction.tsx` (complemento)
- Passar `onEditClick` para `PPTable` que abre o dialog em modo edição
