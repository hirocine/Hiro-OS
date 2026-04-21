
# Cases / Portfólio: 4 colunas no grid de cases adicionados

## Arquivo
`src/pages/ProposalDetails.tsx` (linha 1201)

## Mudança
Alterar o grid da seção "Cases / Portfólio" (cases já adicionados na proposta) de 2 para 4 colunas em telas grandes, mantendo responsividade em telas menores.

```diff
- <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
+ <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
```

Resultado: cards menores, 4 por linha em desktop (≥1280px), com fallback gradual para 3/2/1 colunas em telas menores.

## Escopo
- 1 arquivo, 1 linha
- Sem mudanças no Banco de Cases (dialog), apenas no grid principal exibido na página
- Sem alterações em estrutura de cards, thumbs ou comportamento
