

# Esteira de Pós-Produção

Nova ferramenta para controle da fila de pós-produção, onde cada vídeo é uma linha na tabela. Três visualizações: tabela (padrão), kanban por etapa, e calendário por prazo.

## 1. Banco de Dados

Nova tabela `post_production_queue`:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| title | text NOT NULL | Nome do vídeo |
| project_id | uuid nullable FK → audiovisual_projects | Vínculo opcional |
| project_name | text nullable | Cache do nome do projeto/cliente |
| client_name | text nullable | Nome do cliente (quando sem projeto) |
| editor_id | uuid nullable | Usuário editor responsável |
| editor_name | text nullable | Cache do nome do editor |
| status | text NOT NULL default 'fila' | Etapa atual (fila, edicao, color_grading, finalizacao, revisao, entregue) |
| priority | text NOT NULL default 'media' | baixa, media, alta, urgente |
| due_date | date nullable | Prazo de entrega |
| start_date | date nullable | Quando começou a edição |
| delivered_date | date nullable | Data real de entrega |
| notes | text nullable | Observações |
| created_by | uuid | Quem criou |
| created_at / updated_at | timestamptz | |

RLS: autenticados podem ler; admin e producao podem inserir/atualizar/deletar.

## 2. Estrutura de Arquivos (feature-based, seguindo padrão existente)

```
src/features/post-production/
  types/index.ts          — tipos, configs de status/prioridade
  hooks/
    usePostProduction.ts  — query com filtros
    usePostProductionMutations.ts — create/update/delete
  components/
    PostProductionTable.ts     — tabela inline-edit (padrão Tasks)
    PostProductionKanban.ts    — kanban por status/etapa
    PostProductionCalendar.ts  — calendário por prazo
    PostProductionStatsCards.ts
    PostProductionDialog.ts    — dialog de criação/edição
    StatusBadge.ts / PriorityBadge.ts — reutiliza padrão visual das Tasks
  index.ts

src/pages/PostProduction.tsx  — página principal com tabs (Tabela/Kanban/Calendário)
```

## 3. Página Principal

- Rota: `/esteira-de-pos`
- Layout: `ResponsiveContainer` + `PageHeader` (padrão do projeto)
- Stats cards no topo (total, em edição, atrasados, entregues este mês)
- Tabs: **Tabela** | **Kanban** | **Calendário**
- Botão "Novo Vídeo" no PageHeader
- Busca e filtros (por editor, status, prioridade, projeto)

### Tabela
- Mesmo padrão inline-edit da página de Tarefas (InlineEditCell, InlineSelectCell, InlineDateCell)
- Colunas: Título, Projeto/Cliente, Editor, Etapa, Prioridade, Prazo
- Linha de criação rápida no topo
- Clique na linha abre detalhes

### Kanban
- Colunas por etapa: Fila → Edição → Color Grading → Finalização → Revisão → Entregue
- Cards com título, editor, prazo, badge de prioridade (similar ao SSD Kanban)

### Calendário
- Reutiliza componente de calendário existente para mostrar vídeos por prazo de entrega

## 4. Sidebar

Novo item no bloco MENU principal (visível para todos):
- Ícone: `Clapperboard` (lucide)
- Posição: após "Plataformas" (último do menu principal)
- Label: "Esteira de Pós"

## 5. Etapas de Implementação

Dado o tamanho, sugiro dividir em 3 etapas:
1. **Etapa 1**: Criação da tabela no Supabase + tipos + hook de leitura/mutations + página com visão Tabela funcional + sidebar
2. **Etapa 2**: Visão Kanban + Dialog de detalhes
3. **Etapa 3**: Visão Calendário + Stats cards + filtros avançados

