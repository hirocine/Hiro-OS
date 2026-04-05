

# Unificar campo Vimeo no formulário de case do ProposalDetails

## Contexto
O ProposalGuidedWizard e o ProposalWizard **já usam** campo único `vimeo_url` com preview. Apenas o **ProposalDetails.tsx** ainda tem campos separados `vimeo_id` e `vimeo_hash`.

## Mudanças (arquivo único: `src/pages/ProposalDetails.tsx`)

### 1. State: trocar campos separados por `vimeo_url`
**Linha 143** -- mudar o state de `{ client_name, campaign_name, vimeo_id, vimeo_hash, tags, destaque }` para `{ client_name, campaign_name, vimeo_url, tags, destaque }`.

Atualizar os 2 resets do form (linhas 511 e 543) para usar `vimeo_url: ''`.

### 2. Adicionar parseVimeoUrl
Adicionar a função (mesma do GuidedWizard) antes de `handleCreateCase`:
```tsx
const parseVimeoUrl = (url: string) => {
  const match = url.match(/vimeo\.com\/(\d+)(?:\/([a-zA-Z0-9]+))?/);
  return match ? { vimeo_id: match[1], vimeo_hash: match[2] || '' } : null;
};
```

### 3. handleCreateCase: extrair ID/hash antes de salvar
**Linha 530-548** -- parsear `newCaseForm.vimeo_url` para extrair `vimeo_id` e `vimeo_hash`, passar esses valores para `createCase.mutateAsync`.

### 4. UI: substituir 2 inputs por 1 + preview
**Linhas 1117-1124** -- remover os dois inputs separados (Vimeo ID e Vimeo Hash). Substituir por:
- Um input `col-span-2` com label "Link do Vimeo" e placeholder `https://vimeo.com/1234567890/abc123def`
- Preview da thumbnail abaixo (quando URL válida): `<img src="https://vumbnail.com/${id}.jpg" />` com cantos arredondados

### Arquivos NÃO alterados
Nenhum arquivo em `src/features/proposals/components/public/`.

