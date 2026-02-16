

## Adicionar Transicao Suave no Toggle de Blur

### Resumo

Quando o usuario clica no icone do olho para ocultar/mostrar valores, o blur vai transicionar suavemente (300ms) ao inves de aplicar instantaneamente. Isso cria um efeito mais polido e natural.

### Como vai funcionar

- O valor passa de nitido para blur (e vice-versa) com uma transicao CSS de 300ms
- O efeito se aplica a todos os valores: cards, tooltips do grafico, e o card principal de saldo

### Detalhes Tecnicos

**Arquivos editados:** `src/pages/Dashboard.tsx` e `src/pages/CashFlow.tsx`

**Mudanca unica:** Onde hoje temos `blur-md select-none`, trocar para `blur-md select-none transition-all duration-300` (ou aplicar a classe de transicao no elemento pai).

Concretamente, a variavel `blurClass` muda de:
```
const blurClass = valuesHidden ? 'blur-md select-none' : '';
```
Para:
```
const blurClass = cn('transition-[filter] duration-300', valuesHidden && 'blur-md select-none');
```

Isso garante que a propriedade `filter` (que controla o blur) transicione suavemente tanto ao ativar quanto ao desativar.

A mesma mudanca sera aplicada:
1. No `blurClass` do Dashboard
2. No `blurClass` do CashFlow
3. Na prop `blurred` dos componentes `CashFlowDashCard` e `CashFlowCard` -- adicionar a classe de transicao junto ao blur condicional dentro do componente

