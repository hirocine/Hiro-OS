

# Corrigir React error #310 em `/orcamentos/:slug` (Proposta de Investimento)

## Problema
Após introduzir o `PaymentOptionsEditor`, abrir qualquer proposta dispara o erro `Minified React error #310` e cai no ErrorBoundary ("Algo deu errado").

## Causa raiz
Há uma **corrida entre 3 efeitos** que estão se sobrescrevendo mutuamente em loop:

1. **`ProposalDetails.tsx` linha 191** — popula `investForm` (incluindo `payment_options`) quando a proposta carrega.
2. **`ProposalDetails.tsx` linha 566** — se `payment_options` estiver vazio, injeta a condição default. Esse efeito tem deps só `[proposal?.id]`, mas lê `investForm` do closure (stale). Pode rodar **antes** do efeito 191 popular o estado e, pior, sobrescrever propostas que já têm `payment_options` salvos no banco se o estado local ainda estiver vazio na primeira passagem.
3. **`PaymentOptionsEditor.tsx` linha 35** — quando `finalValue` muda, recalcula `valor`/`descricao` e chama `onChange`. Como `investFinalValue` (linha 562 do pai) é recalculado a cada render via expressão inline, qualquer atualização de `investForm` faz `finalValue` parecer "novo" para a comparação por referência primitiva — mas como é `number`, a comparação `===` funciona. O problema real é a **ordem das chamadas**: o `onChange` dispara `setInvestForm` durante render-cycle do filho, que re-renderiza o pai, que re-monta condicionalmente nodes do JSX dependendo de `proposal`/`isLoading`, alterando a contagem de hooks de uma fase para outra.

O ErrorBoundary captura no momento em que o efeito 566 dispara `setInvestForm` em paralelo ao efeito do editor, gerando uma fase em que React vê uma árvore com hooks diferente.

## Correção

### 1. Mover a inicialização default para dentro do efeito de populate (linha 191)
Em vez de ter dois `useEffect` separados disputando o mesmo estado, inicializar `payment_options` **dentro** do mesmo efeito que popula o resto do form:

- Se `proposal.payment_options` existir e tiver itens → usa o que veio do banco.
- Se vier vazio/null → cria `[buildPaymentOption('faturamento', {dias:30}, finalValueDoBanco, {recomendado:true})]`.

Remover por completo o `useEffect` da linha 566.

### 2. Estabilizar `finalValue` passado ao editor
Trocar a expressão inline `const investFinalValue = ...` (linha 562) por um `useMemo` com deps `[investForm.list_price, investForm.discount_pct]`. Isso garante referência estável e elimina recomputo em renders não relacionados.

### 3. Proteger o `onChange` do editor contra loops
No `PaymentOptionsEditor` (linha 35), além da comparação `lastFinalValue.current === finalValue`, adicionar guard `if (finalValue <= 0) return;` para não recalcular durante o boot (quando `list_price` ainda é 0 e a proposta nem carregou).

### 4. Garantir que o editor não dispare `onChange` durante render
A função `recalcPaymentOptions` é chamada dentro de `useEffect` (correto), mas o `addOption` inicial não deve rodar em mount. Já está OK — apenas confirmar que não há `onChange` síncrono em código de renderização.

## Arquivos alterados
- `src/pages/ProposalDetails.tsx` — unificar o useEffect de populate (191) com a inicialização de `payment_options`, remover useEffect 566, trocar `investFinalValue` por `useMemo`.
- `src/features/proposals/components/PaymentOptionsEditor.tsx` — adicionar guard `finalValue <= 0` no useEffect de recálculo.

## Escopo
- 2 arquivos, mudanças cirúrgicas
- Sem alteração em DB, hooks, types ou componentes públicos
- Comportamento funcional preservado: propostas existentes carregam suas condições salvas; novas propostas ganham "Faturamento 30d" como default; recálculo automático ao mudar valor continua funcionando

