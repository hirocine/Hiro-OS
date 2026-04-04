

# Fix: Entregáveis não aparecem na página de gerenciamento

## Problema

Há um **descompasso de formato** entre como o Wizard salva e como o ProposalDetails lê os entregáveis.

**Wizard salva** no banco como array de blocos:
```json
[
  { "label": "Output", "titulo": "Entregas do Projeto", "itens": [...] },
  { "label": "Serviços", "titulo": "O que está incluso", "cards": [...] }
]
```

**ProposalDetails espera** ao carregar:
```json
{ "entregaveis": [...], "incluso_categories": [...] }
```
ou
```json
[{ "entregaveis": [...], "incluso_categories": [...] }]
```

Como o formato não bate (`itens` vs `entregaveis`, `cards` vs `incluso_categories`), o parsing cai no `else` e inicializa tudo vazio.

## Solução

Corrigir o parsing no `useEffect` do `ProposalDetails.tsx` (linhas ~219-233) para reconhecer o formato salvo pelo Wizard:

1. Verificar se `rawEntregaveis` é um array com objetos contendo `label`
2. Extrair os itens do bloco `"Output"` e mapear para o formato `EntregavelItem[]`
3. Extrair os cards do bloco `"Serviços"` e reconstruir as `incluso_categories`
4. Manter compatibilidade com o formato antigo (caso já exista)

Também ajustar o `saveSection('entregaveis')` para salvar de volta no formato que o Wizard e a página pública esperam (array de blocos com `label`), garantindo consistência bidirecional.

## Alteração

**Arquivo: `src/pages/ProposalDetails.tsx`**

- **Parsing (useEffect)**: Adicionar detecção do formato `[{ label: "Output", itens: [...] }, { label: "Serviços", cards: [...] }]` e converter para o estado interno `{ entregaveis, incluso_categories }`
- **Save (saveSection)**: Ao salvar `entregaveis`, converter de volta para o formato de array de blocos antes de enviar ao banco

