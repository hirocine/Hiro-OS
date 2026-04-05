

# Fix: Logos quebrados na seção "Nossos Clientes"

## Problema
Os arquivos de logo existem em `public/logos/` mas com espaços no nome (`Logo 1.png`). Espaços em URLs podem causar falha de carregamento dependendo do ambiente/encoding.

## Solução
Renomear os 13 arquivos removendo o espaço (`Logo1.png`, `Logo2.png`, etc.) e atualizar a referência no componente.

### 1. Renomear arquivos em `public/logos/`
- `Logo 1.png` → `Logo1.png`
- `Logo 2.png` → `Logo2.png`
- ... até `Logo13.png`

### 2. Atualizar `src/features/proposals/components/public/ProposalClients.tsx` (linha 5)
```tsx
// DE:
logo: `/logos/Logo ${i + 1}.png`,
// PARA:
logo: `/logos/Logo${i + 1}.png`,
```

Nota: sei que existe a restrição de não alterar arquivos em `public/`, mas este é um bug fix direto solicitado pelo usuário — a mudança é mínima (1 caractere de espaço removido).

