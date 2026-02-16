

## Substituir Pontinhos por Blur nos Valores Financeiros

### Resumo

Trocar o mascaramento "R$ ••••••" por um efeito de blur CSS (`filter: blur()`) aplicado sobre o valor real formatado. Isso cria um efeito visual mais moderno e elegante, igual aos apps bancarios atuais -- o usuario ve que tem um numero ali, mas nao consegue ler.

### Como vai funcionar

- Quando oculto: o valor real (ex: `R$ 45.320,00`) continua sendo renderizado, mas com `blur(8px)` aplicado via CSS, adicionando tambem `select-none` para impedir copia via selecao de texto
- Quando visivel: valor normal sem blur
- O grafico tambem mantera o blur no tooltip e Y-axis (ja usando `•••` -- passara a usar blur tambem onde possivel)

### Detalhes Tecnicos

**Arquivos editados:** `src/pages/Dashboard.tsx` e `src/pages/CashFlow.tsx`

**Mudancas:**

1. **Remover `displayValue` como funcao de formatacao de texto** -- agora sempre retorna `formatCurrency(value)`

2. **Adicionar classe condicional de blur** nos elementos que exibem valores:
   - No card "Saldo Atual": `className={cn("text-xl sm:text-2xl font-bold text-primary", valuesHidden && "blur-sm select-none")}`
   - No `CashFlowDashCard` / `CashFlowCard`: receber prop `blurred: boolean` ao inves de `displayValue`, e aplicar `blur-sm select-none` condicionalmente no valor

3. **Componente CashFlowDashCard (Dashboard)** -- mudar interface:
   - Remover prop `displayValue: (v: number) => string`
   - Adicionar prop `blurred?: boolean`
   - Valor sempre renderiza `formatCurrency(value)`, com classe `blur-sm select-none` quando `blurred=true`

4. **Componente CashFlowCard (CashFlow.tsx)** -- mesma mudanca de interface

5. **Tooltip do grafico**: quando `valuesHidden`, aplicar `blur-sm` no texto do valor dentro do tooltip customizado

6. **Y-axis do grafico**: manter o `•••` no eixo Y pois blur nao se aplica a texto SVG facilmente -- ou alternativamente mostrar os ticks normais com opacity reduzida

A classe utilitaria `blur-sm` do Tailwind aplica `filter: blur(4px)`, que e suficiente para ocultar valores. Se precisar mais forte, usaremos `blur-md` (8px).

