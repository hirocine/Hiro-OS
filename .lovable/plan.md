

# Redesenhar seções do ProposalOverview.tsx

## Mudança (arquivo único: `src/pages/ProposalOverview.tsx`)

### 1. Dados do Cliente — grid com bordas finas

Substituir o layout atual (ícones + texto, linhas 126-159) por um grid com efeito de bordas usando `gap-px bg-border` com células `bg-background`:

```
┌──────────────────────┬──────────────────────┐
│ CLIENTE              │ PROJETO              │
│ Azzas 2154           │ EAD - Treinamento... │
├──────────────────────┼──────────────────────┤
│ RESPONSÁVEL          │ WHATSAPP             │
│ Juliana...           │ +55 (11) 95151...    │
├──────────────────────┴──────────────────────┤
│ DESCRIÇÃO DA EMPRESA                        │
│ texto completo em muted...                  │
└─────────────────────────────────────────────┘
```

- Labels: `text-[11px] uppercase tracking-wider text-muted-foreground/60 mb-0.5`
- Valores: `text-sm font-medium`
- Descrição: `col-span-2`, valor sem `font-medium`, em `text-muted-foreground`
- Remover ícones Building2/FileText/User/Phone das células (limpar imports não usados)
- Header com "Dados do Cliente" + botão "Editar →" mantido

### 2. Investimento — novo card (inserir entre Dados do Cliente e Histórico de Visualizações)

Card com `CardHeader` ("Investimento") e grid de 3 colunas usando mesmo padrão `gap-px bg-border`:

```
┌──────────────┬──────────────┬──────────────┐
│ VALOR TABELA │ DESCONTO     │ VALOR FINAL  │
│ R$ 25.000    │ -10%         │ R$ 22.500    │
│ (line-thru)  │ (verde)      │ (destaque)   │
└──────────────┴──────────────┴──────────────┘
```

- Valor de tabela: `line-through text-muted-foreground` — usa `proposal.list_price`
- Desconto: `text-green-500` — usa `proposal.discount_pct`
- Valor final: `text-lg font-medium` — usa `proposal.final_value`
- Formatar valores com `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`
- Se `list_price` for null/0, mostrar "—"

### 3. Histórico de Visualizações — timeline vertical

Substituir a tabela (linhas 162-209) por lista vertical:

- Header: "Histórico de Visualizações" + `{views.length} registros` à direita em `text-xs text-muted-foreground`
- Cada view é uma row `flex items-center gap-3 py-3 border-b last:border-0`:
  - Esquerda: ícone em div 36x36 rounded-lg
    - Desktop: `bg-green-500/10 text-green-500` + Monitor
    - Mobile: `bg-blue-500/10 text-blue-500` + Smartphone
  - Centro (`flex-1`):
    - L1: "Desktop"/"Mobile" `text-sm font-medium` + browser/OS `text-xs text-muted-foreground/60 ml-2`
    - L2: data/hora `text-xs text-muted-foreground`
  - Direita: tempo na página `text-xs text-muted-foreground`

- Função helper `parseUserAgent(ua)`: extrai browser (Chrome/Safari/Firefox/Edge/outro) e OS (macOS/Windows/iOS/Android/outro) do user_agent com regex simples

### 4. Ordem das seções
1. Header card (inalterado)
2. Dados do Cliente (redesenhado)
3. Investimento (novo)
4. Histórico de Visualizações (redesenhado)
5. Histórico de Alterações — placeholder (inalterado)

### Imports
- Remover: `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`, `User`, `Phone` (não mais usados)
- Manter: `Building2`, `FileText` apenas se usados no header; caso contrário remover também

Nenhum arquivo em `src/features/proposals/components/public/` será alterado.

