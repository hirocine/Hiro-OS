

# Página de detalhes da proposta com edição inline

## Contexto
Atualmente a edição de propostas usa um Dialog grande. O usuário quer editar diretamente na página, como acontece em Retiradas (`/retiradas/:id`).

## Plano

### 1. Criar rota `/orcamentos/:id`
**Arquivo**: `src/App.tsx`
- Adicionar `<Route path="orcamentos/:id" element={<ProposalDetails />} />`

### 2. Criar página `src/pages/ProposalDetails.tsx`
Layout similar ao ProjectDetails:
- **Breadcrumb**: `Orçamentos > Nome do Projeto`
- **Botões no header**: "Ver Proposta" (abre pública), "Excluir" no menu "..."
- **Card de cabeçalho**: Logo, nome do cliente, projeto, status (editável inline via Select), valor, datas
- **Seções editáveis inline** (cada uma com ícone de edição que ativa modo de edição):
  - **Cliente e Projeto**: nome, responsável, logo, WhatsApp, descrição
  - **Investimento**: valor de tabela, desconto, condições de pagamento
  - **Objetivo e Diagnóstico**: objetivo, dores
  - **Depoimento**: nome, cargo, texto, imagem
- Cada seção alterna entre modo visualização e modo edição com botões Salvar/Cancelar
- Usa `useProposalDetails` (por ID) + `updateProposal` do `useProposals`

### 3. Criar hook `useProposalDetailsById`
**Arquivo**: `src/features/proposals/hooks/useProposalDetailsById.ts`
- Query por ID em vez de slug (para uso interno)

### 4. Atualizar navegação no ProposalCard
**Arquivo**: `src/features/proposals/components/ProposalCard.tsx`
- O botão "Editar" no dropdown navega para `/orcamentos/${proposal.id}` em vez de abrir o dialog
- Remover `onEdit` prop

### 5. Limpar EditProposalDialog
**Arquivo**: `src/pages/Proposals.tsx`
- Remover estado `editingProposal` e o `EditProposalDialog`

### 6. Remover `EditProposalDialog.tsx`
- Arquivo não será mais necessário

## Detalhes técnicos
- Cada seção terá estado `editingSection` para controlar qual seção está em modo edição
- Salvamento individual por seção (não precisa salvar tudo de uma vez)
- Reutiliza `compressImage` para upload de logo
- Padrão visual: Card com título da seção + botão ghost de edição no canto direito

