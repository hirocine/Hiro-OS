

# Refatorar Formulário de Proposta — Layout e Campos

## Problemas identificados

1. **Logo desnecessário** — O novo template (ProposalHero) não usa logo do cliente. O campo de upload de logo deve ser removido.
2. **Diagramação ruim no Step 0** — O layout coloca logo + campos lado a lado, criando um layout desbalanceado. Precisa ser reorganizado em grid limpo.

## Alterações

### 1. Remover campo de logo (`ProposalWizard.tsx`)

- Remover o bloco de upload de logo (Avatar, `handleLogoChange`, `removeLogo`, `client_logo_file`, `client_logo_preview`)
- Remover imports não usados (`Avatar`, `AvatarImage`, `AvatarFallback`, `Upload`, `X`)

### 2. Reorganizar Step 0 — Cliente e Projeto

Layout novo em grid limpo:
```
[Nome do Cliente *]     [Nome do Projeto *]
[Responsável]           [WhatsApp]
[Data de Validade]
```

Sem logo, sem layout flex desbalanceado. Tudo em `grid grid-cols-1 sm:grid-cols-2 gap-4`.

### 3. Remover campos do tipo (`ProposalFormData`)

- Remover `client_logo_file` e `client_logo_preview` do `ProposalFormData` e `defaultFormData` em `types/index.ts`

### 4. Atualizar hook de criação (`useProposals.ts`)

- Remover lógica de upload de logo ao criar proposta (se existir)

