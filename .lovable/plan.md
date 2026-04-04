

# Banco de Depoimentos (igual ao padrão de Dores)

## Resumo

Criar uma tabela `proposal_testimonials` no banco de dados e transformar a seção de Depoimento na página de detalhes para funcionar como a seção de Dores: o usuário abre um Dialog, navega pelo banco de depoimentos existentes, seleciona um, e ele é copiado para a proposta. Também pode criar depoimentos novos direto no banco.

## Alterações

### 1. Migration: criar tabela `proposal_testimonials`

Campos: `id`, `name` (texto), `role` (texto), `text` (texto), `image` (URL), `created_by`, `created_at`. RLS com acesso para authenticated. Seed com o depoimento padrão (Thiago Nigro).

### 2. Hook: `useTestimonials.ts`

Seguir o padrão exato do `usePainPoints.ts`: query para listar todos, mutation para criar novo. Arquivo em `src/features/proposals/hooks/useTestimonials.ts`.

### 3. Tipo: adicionar `Testimonial` interface

Em `src/features/proposals/types/index.ts`, adicionar:
```ts
interface Testimonial {
  id: string; name: string; role: string; text: string;
  image: string | null; created_by: string | null; created_at: string;
}
```

### 4. ProposalDetails.tsx - Substituir formulário por seleção

- Importar `useTestimonials`
- Adicionar state `showTestimonialBank` (boolean)
- Trocar os inputs de nome/cargo/texto por um card de preview do depoimento selecionado (com botão de remover)
- Botão "Selecionar do Banco" abre Dialog com lista de depoimentos disponíveis (cards com foto, nome, cargo, trecho do texto)
- Opção de "Criar novo depoimento" dentro do Dialog (formulário com nome, cargo, texto, upload de foto)
- Ao selecionar, preenche `testimonialForm` com os dados e adiciona `testimonial_image`
- Dirty check e save continuam funcionando como antes

### 5. Upload de foto do depoimento

No Dialog de criação de novo depoimento, incluir campo de upload de imagem (usando o mesmo padrão de upload do logo da proposta), salvando no storage do Supabase.

