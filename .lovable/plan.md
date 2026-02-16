

## Valores Ocultos por Padrao + Efeito Blur

### Resumo

Duas mudancas combinadas:
1. **Padrao oculto**: ao abrir/recarregar a pagina, os valores ja vem escondidos (sem depender do localStorage)
2. **Blur no lugar dos pontinhos**: trocar "R$ ••••••" por blur CSS nos numeros reais, criando um visual mais moderno

### Como vai funcionar

- O estado inicial de `valuesHidden` passa a ser `true` (fixo), ignorando o localStorage para o valor inicial
- O localStorage continua sendo usado para gravar a preferencia ao clicar no botao, mas ao recarregar sempre comeca oculto
- Valores ocultos exibem o numero real (ex: `R$ 45.320,00`) com `blur-sm select-none` aplicado via CSS
- Tooltip do grafico tambem recebe blur quando oculto
- Y-axis do grafico mantem `•••` pois blur nao funciona bem em SVG

### Detalhes Tecnicos

**Arquivos editados:** `src/pages/Dashboard.tsx` e `src/pages/CashFlow.tsx`

**Mudancas em ambos os arquivos:**

1. Estado inicial: `useState(true)` ao inves de ler localStorage
2. Remover funcao `displayValue` que retornava "R$ ••••••"
3. Sempre renderizar `formatCurrency(value)` nos valores
4. Adicionar `blur-sm select-none` condicional nos elementos de valor:
   - Card "Saldo Atual": `className={cn("text-xl sm:text-2xl font-bold text-primary", valuesHidden && "blur-sm select-none")}`
   - Tooltip do grafico: `className={cn("text-primary font-medium", valuesHidden && "blur-sm select-none")}`
5. Subtitle do "Fluxo Liquido Atual": tambem aplicar blur ao inves de esconder

**Dashboard.tsx - CashFlowDashCard:**
- Trocar prop `displayValue: (v: number) => string` por `blurred?: boolean`
- Valor: `className={cn("text-base sm:text-lg lg:text-xl font-bold truncate", valueClassName, blurred && "blur-sm select-none")}`
- Todas as chamadas passam `blurred={valuesHidden}` ao inves de `displayValue={displayValue}`

**CashFlow.tsx - CashFlowCard:**
- Mesma mudanca de interface: trocar `displayValue` por `blurred`
- Valor: `className={cn("text-2xl font-bold", valueClassName, blurred && "blur-sm select-none")}`
