

# Remover botão "Ver Proposta" do rodapé do ProposalCard

## Mudança
No arquivo `src/features/proposals/components/ProposalCard.tsx`, remover o botão "Ver Proposta" do rodapé, já que ele duplica a ação do botão "Editar" (ambos navegam para `/orcamentos/:slug/overview`).

## Arquivo
`src/features/proposals/components/ProposalCard.tsx` (linhas ~145-147)

Remover apenas:
```tsx
<Button size="sm" onClick={() => navigate(`/orcamentos/${proposal.slug}/overview`)} className="h-7 text-xs px-3">
  <ExternalLink className="mr-1.5 h-3 w-3" /> Ver Proposta
</Button>
```

Mantém-se intactos:
- "Copiar Link" (rodapé)
- "Editar" (rodapé) — leva ao mesmo destino
- Item "Ver Proposta" no menu kebab (esse abre a versão pública `/orcamento/:slug` em nova aba — comportamento diferente, deve permanecer)

## Escopo
- 1 arquivo, 3 linhas removidas
- Sem outras alterações

