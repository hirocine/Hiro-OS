

# Melhorar Dialog do Banco de Depoimentos + Edição

## Problema

O Dialog de depoimentos está com layout simples (max-w-lg, sem estrutura de header/body separada), diferente do padrão visual do Banco de Dores (max-w-4xl, p-0, header com border-b, body com scroll independente). Além disso, não é possível editar depoimentos existentes no banco.

## Alterações

### 1. Hook: adicionar `updateTestimonial` mutation (`useTestimonials.ts`)

Adicionar mutation de update por id, invalidando a query após sucesso.

### 2. Dialog visual igual ao de Dores (`ProposalDetails.tsx`, linhas ~1328-1448)

- `max-w-lg` → `sm:max-w-2xl`
- `p-0` com header separado (px-6 pt-6 pb-4 border-b) e body scrollável (px-6 py-4)
- Cards dos depoimentos em grid com estilo igual aos cards de dores (border, hover:border-primary/30, selected state)
- Avatar sempre visível com fallback de iniciais
- Botão de editar (ícone Pencil) em cada card do banco, que abre o formulário de edição preenchido

### 3. Estado de edição

- Adicionar `editingTestimonialId` state (string | null)
- Quando clica em editar, preenche o form com dados do depoimento e mostra o formulário (reutiliza o form de criação)
- Botão "Salvar alterações" chama `updateTestimonial` em vez de `createTestimonial`

### 4. Fluxo

- Clicar no card → seleciona para a proposta (como hoje)
- Clicar no ícone de editar → abre formulário de edição inline
- "Criar novo" → abre formulário em branco (como hoje)

