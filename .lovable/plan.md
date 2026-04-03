

# Ajustes no Hero da Proposta Pública

## Mudanças

### 1. Hero: trocar "HIRO FILMS" pelo nome do projeto
Onde hoje está hardcoded `HIRO FILMS`, exibir `projectName` em caixa alta. O subtítulo fixo ("Produtora audiovisual especializada...") será substituído pelo novo campo `company_description`.

### 2. Novo campo "Descrição da Empresa" no formulário (Step 0)
Adicionar um campo `Textarea` na primeira etapa do wizard para o usuário preencher uma descrição curta da empresa (ex: "Produtora audiovisual especializada em criar narrativas visuais que conectam marcas ao seu público."). Valor default = o texto atual hardcoded.

### 3. Persistir no banco
Adicionar coluna `company_description` (text, nullable) na tabela `orcamentos` via migration. Salvar e ler esse campo no `useProposals`.

## Arquivos afetados

- **Migration**: nova coluna `company_description` na tabela `orcamentos`
- **`src/features/proposals/types/index.ts`**: adicionar `company_description` no tipo `Proposal` e `ProposalFormData`, e no `defaultFormData`
- **`src/features/proposals/components/ProposalWizard.tsx`**: adicionar campo Textarea no Step 0
- **`src/features/proposals/hooks/useProposals.ts`**: incluir `company_description` no insert e no mapProposal
- **`src/features/proposals/components/public/ProposalHero.tsx`**: receber `companyDescription` como prop; trocar h1 para `projectName.toUpperCase()` e subtítulo para `companyDescription`
- **`src/features/proposals/components/ProposalPublicPage.tsx`**: passar `companyDescription` ao `ProposalHero`

