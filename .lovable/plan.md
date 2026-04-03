

# Adicionar upload de logo da empresa no Step 1 do Wizard

## Contexto
O campo `client_logo` já existe na tabela `orcamentos` e no tipo `Proposal`, e o `ProposalCard` já exibe a logo quando disponível. Porém, o `ProposalFormData` não inclui esse campo e o wizard não tem o upload.

## Plano

### 1. Adicionar `client_logo` ao tipo e default do form
**Arquivo**: `src/features/proposals/types/index.ts`
- Adicionar `client_logo: string;` ao `ProposalFormData`
- Adicionar `client_logo: ''` ao `defaultFormData`

### 2. Adicionar upload de logo no Step 0 do Wizard
**Arquivo**: `src/features/proposals/components/ProposalWizard.tsx`
- Adicionar um campo de upload de logo no início do step "Cliente e Projeto"
- Usar o padrão já existente no projeto (upload para Supabase Storage via `supabase.storage`)
- Exibir preview circular da logo com fallback de ícone `Building2`
- Permitir remover a logo

### 3. Salvar `client_logo` no insert
**Arquivo**: `src/features/proposals/hooks/useProposals.ts`
- Adicionar `client_logo: form.client_logo.trim() || null` ao objeto de insert

## Detalhes técnicos
- O upload será feito para o bucket existente (provavelmente `orcamento-assets` ou similar — verificar buckets disponíveis)
- A logo aparecerá como um Avatar clicável no topo do Step 0, antes dos campos de texto
- Layout: avatar grande (80x80) com botão de upload sobreposto, similar ao padrão de avatar upload já usado em outras partes do app

