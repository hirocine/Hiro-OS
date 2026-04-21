

# Banco de Condições de Pagamento (presets parametrizáveis)

## Problema
Hoje as opções de pagamento são duas cards genéricas digitadas manualmente, sem lógica. Não dá para representar "Faturamento 30d", "5x", "10% à vista" etc. de forma escalável, e não há nenhuma proteção garantindo pelo menos 1 condição.

## Modelo proposto

Criar um **banco de presets** internos. Cada preset gera dinamicamente o `PaymentOption` que vai para o JSONB `payment_options` (mesmo schema atual — **público continua intocado**).

### Presets disponíveis
1. **Faturamento Nd** — parâmetro: `dias` (default 30). Renderiza valor cheio + "Faturamento em N dias".
2. **Parcelado entrada/entrega** — parâmetros: `pctEntrada` (default 50), `pctEntrega` (default 50). Valida soma = 100%. Renderiza "Nx R$ X" + "X% no fechamento + Y% na entrega".
3. **À Vista c/ desconto** — parâmetro: `descontoPct` (default 5). Renderiza valor com desconto + "X% de desconto para pagamento único".
4. **Parcelado em N x** — parâmetro: `parcelas` (default 5), `juros` opcional. Renderiza "Nx R$ X" + descrição.

Cada preset guarda no JSONB:
```ts
{ titulo, valor, descricao, destaque, recomendado,
  preset: 'faturamento'|'entrada_entrega'|'avista_desconto'|'parcelado',
  params: { ... } }
```

Os campos `preset` e `params` são **aditivos** — o renderer público ignora (lê só os 5 originais), então nada quebra.

## Regras de negócio
- **Mínimo 1, máximo 2** condições ativas por proposta.
- Default ao criar proposta: **1x "Faturamento 30d"** já adicionada e marcada como recomendada.
- Botão "Adicionar condição" desabilita quando já há 2.
- Botão remover (X) desabilita quando só resta 1.
- Trocar parâmetros recalcula `valor`/`descricao` em tempo real.
- Recalcular automaticamente ao alterar `finalValue` (já existe esse efeito).

## UI nova (idêntica nos 2 lugares)

Em vez do input livre de "Título/Descrição/Badge", cada card vira um seletor compacto:

```
┌─────────────────────────────────────┐
│ [Faturamento ▾]              [X]    │  <- Select do preset
│                                     │
│   Valor calculado                   │
│   R$ 6.978,72                       │
│                                     │
│   Dias: [30]                        │  <- inputs dependentes do preset
│                                     │
│   Badge (opcional): [Mais comum]    │
│   Recomendado            [toggle]   │
└─────────────────────────────────────┘

[+ Adicionar condição]   (disabled se já tem 2)
```

Os parâmetros mudam conforme o preset:
- Faturamento: 1 input (dias)
- Entrada/entrega: 2 inputs (% entrada, % entrega) com validação 100%
- À vista c/ desconto: 1 input (% desconto)
- Parcelado N x: 1 input (nº parcelas)

## Implementação técnica

### Novo arquivo
`src/features/proposals/lib/paymentPresets.ts`
- Tipo `PaymentPreset = 'faturamento' | 'entrada_entrega' | 'avista_desconto' | 'parcelado'`
- Função `buildPaymentOption(preset, params, finalValue): PaymentOption` — devolve `{titulo, valor, descricao, destaque, recomendado, preset, params}`
- Constante `DEFAULT_PRESET_PARAMS` com defaults por preset
- Constante `PRESET_LABELS` para o select

### Novo componente compartilhado
`src/features/proposals/components/PaymentOptionsEditor.tsx`
- Props: `value: PaymentOption[]`, `onChange`, `finalValue`
- Renderiza grid com cards dos presets, +/- botões, regras min/max
- Recalcula valores automaticamente quando `finalValue` ou `params` mudam

### Arquivos modificados
1. **`src/features/proposals/types/index.ts`** — estender `PaymentOption` com `preset?` e `params?` opcionais (compat retroativa).
2. **`src/features/proposals/components/ProposalGuidedWizard.tsx`** —
   - Default state: `[buildPaymentOption('faturamento', {dias:30}, 0)]` em vez das duas cards atuais.
   - Substituir bloco do step 8 (linhas 1468-1539) por `<PaymentOptionsEditor>`.
   - Remover o useEffect de auto-cálculo antigo (lógica fica dentro do editor).
3. **`src/pages/ProposalDetails.tsx`** —
   - Substituir bloco linhas 886-977 por `<PaymentOptionsEditor>`.
   - Remover useEffect das linhas 562-574 (substituído pela lógica do editor).
   - Migração leve ao carregar: se `payment_options` vier vazio do banco, inicializar com `[buildPaymentOption('faturamento', {dias:30}, finalValue)]` localmente (não força save até usuário editar).

### Compatibilidade com propostas antigas
Propostas existentes têm `payment_options` sem `preset`. O editor detecta isso e exibe um card legado "Personalizado" com inputs livres (mesma UI antiga em modo compacto), até o usuário trocá-lo por um preset. Sem migração de banco.

### Renderer público
**Não alterado.** O `ProposalInvestimento.tsx` continua lendo `titulo`/`valor`/`descricao`/`destaque`/`recomendado` exatamente como hoje. Os campos novos (`preset`, `params`) são ignorados.

## Escopo
- 2 arquivos novos (`paymentPresets.ts`, `PaymentOptionsEditor.tsx`)
- 3 arquivos modificados (types, wizard, details)
- 0 mudanças em DB, edge functions, componentes públicos
- 0 mudanças em outros módulos

