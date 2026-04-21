

# Adicionar etapa "Validação Cliente" antes de Entrega na Esteira de Pós

## Contexto
Hoje o pipeline tem 5 macro-etapas: Na Fila → Edição → Finalização → Revisão → Entrega. Falta uma etapa entre **Revisão** (revisão interna do nosso time) e **Entrega** (export final + envio), que é o momento em que o vídeo está aprovado internamente e foi **enviado ao cliente para validação**, aguardando aprovação ou pedido de correção.

## Nova etapa
**Validação Cliente** — fica entre Revisão e Entrega.

Pipeline final (6 etapas):
```text
Na Fila → Edição → Finalização → Revisão → Validação Cliente → Entrega
```

### Sub-etapas da Validação Cliente
- Enviar ao cliente
- Aguardando feedback
- Cliente aprovou

### Comportamento de "voltar para correção"
Quando o vídeo está em **Validação Cliente** e o cliente pede ajustes, o usuário precisa de uma ação rápida que:
1. Volta o status para **Edição** (sub_status_index 0)
2. Cria automaticamente uma nota/comentário no card de Atividade marcando "Cliente solicitou correção" + (opcional) texto digitado
3. Mostra um toast de confirmação

Isso aparece como um botão dedicado **"Solicitar correção (voltar para Edição)"** dentro do bloco de sub-etapas da Validação Cliente, ao lado do botão padrão "Avançar para Entrega". Ao clicar, abre um pequeno popover/inline com textarea opcional ("O que precisa ajustar?") e botão Confirmar.

## Arquivos a alterar

### 1. `src/features/post-production/types/index.ts`
- Adicionar `'validacao_cliente'` ao tipo `PPStatus`
- Adicionar entrada em `PP_STATUS_ORDER` (entre `revisao: 4` e `entregue`, renumerar `entregue` para 6)
- Adicionar entrada em `PP_STATUS_CONFIG` com label "Validação Cliente" e cor (cyan/teal — distinta de revisão amarela e entregue verde)
- Adicionar à lista `PP_STATUS_COLUMNS`

### 2. `src/features/post-production/components/PPVideoPage.tsx`
- Adicionar `{ key: 'validacao_cliente', label: 'Validação Cliente' }` em `MACRO_STEPS` antes de `entregue`
- Adicionar sub-etapas em `SUB_STEPS.validacao_cliente`: `['Enviar ao cliente', 'Aguardando feedback', 'Cliente aprovou']`
- No bloco de sub-etapas (linhas 401-472), quando `normalizedStatus === 'validacao_cliente'`, renderizar botão extra **"Solicitar correção"** que:
  - Abre estado local `requestingCorrection` com textarea opcional
  - Ao confirmar: chama `addComment.mutateAsync` com texto "🔄 Cliente solicitou correção" + (texto opcional) e `updateItem.mutate({ status: 'edicao', sub_status_index: 0 })`
  - Toast: "Vídeo retornou para Edição"

### 3. `src/features/post-production/components/PPDialog.tsx`
- Já lista todos os status via `Object.keys(PP_STATUS_CONFIG)` — herda automaticamente a nova etapa.

### 4. `src/features/post-production/components/PPKanban.tsx` e `PPTable.tsx`
- Verificar se renderizam colunas/agrupamentos baseados em `PP_STATUS_COLUMNS` ou no config — se sim, herdam automaticamente a nova etapa Kanban/coluna.

## Banco de dados
Coluna `status` é `text` **sem CHECK constraint** (verificado nas migrations 20260225 e 20260317). Não precisa migration — apenas o valor `'validacao_cliente'` será aceito automaticamente. Itens existentes com status antigo continuam funcionando (já existe lógica de normalização para `color_grading` legacy).

## Escopo
- 2 arquivos principais alterados (`types/index.ts`, `PPVideoPage.tsx`)
- 0 migrations
- 0 mudanças no schema
- Comportamento de "voltar para correção" registra histórico no card Atividade & Versões existente

