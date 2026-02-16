

## Botao de Esconder/Mostrar Saldo (estilo banco)

### Resumo

Adicionar um botao com icone de olho (Eye/EyeOff) no card "Saldo Atual Disponivel" que alterna entre mostrar o valor real e exibir "R$ ••••••" -- igual aos apps de banco. O estado sera persistido no `localStorage` para manter a preferencia do usuario entre sessoes. A funcionalidade sera aplicada em ambas as paginas (Dashboard e Fluxo de Caixa dedicado), e tambem afetara os demais cards de valores na secao para consistencia total.

### Comportamento

- Clique no icone de olho: alterna visibilidade de TODOS os valores monetarios da secao Fluxo de Caixa
- Valor oculto exibido como: `R$ ••••••`
- Estado salvo em `localStorage` com chave `cashflow-values-hidden`
- Icone: `Eye` (visivel) / `EyeOff` (oculto) do lucide-react

### Detalhes Tecnicos

**Arquivos editados:**

| Arquivo | Acao |
|---------|------|
| `src/pages/Dashboard.tsx` | Adicionar estado de visibilidade e botao no card de saldo |
| `src/pages/CashFlow.tsx` | Mesmo toggle, mantendo consistencia com o Dashboard |

**Mudancas em ambos os arquivos:**

1. Adicionar estado `useState` inicializado a partir do `localStorage`:
   ```
   const [valuesHidden, setValuesHidden] = useState(() =>
     localStorage.getItem('cashflow-values-hidden') === 'true'
   )
   ```

2. Funcao toggle que atualiza estado e `localStorage`

3. No card "Saldo Atual Disponivel", substituir o icone Wallet no canto direito por um botao clicavel com `Eye`/`EyeOff`

4. Helper para formatar valor: se oculto, retorna `R$ ••••••`; se visivel, usa `formatCurrency` normal

5. Aplicar o helper em todos os cards da secao Fluxo de Caixa (saldo, receitas, despesas, fluxo liquido, contas a receber, contas a pagar, saldo projetado)

