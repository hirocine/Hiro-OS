

# Substituir Template da Proposta Comercial pelo Novo Design

## Resumo

O repositório `hirocine/github-importer` contém um template de proposta comercial cinematográfico com seções: Hero, Clients (slider infinito), Cases (vídeos Vimeo), Objetivo/Diagnóstico (3 dores), Entregáveis (checklist), Investimento (valor riscado + desconto + depoimento), Próximos Passos (timeline com countdown), Navbar (countdown), DownloadButton (WhatsApp + PDF), e Footer.

O template usa Helvetica Now Display, `framer-motion`, `react-use-measure`, e cores `accent: #4CFF5C` sobre fundo preto.

---

## Etapa 1 — Migração de banco de dados (novas colunas em `orcamentos`)

Campos novos necessários para o novo template (todos opcionais para retrocompatibilidade):

| Coluna | Tipo | Default | Uso |
|---|---|---|---|
| `objetivo` | `text` | `null` | Texto de diagnóstico do projeto |
| `diagnostico_dores` | `jsonb` | `'[]'` | Array de `{label, title, desc}` (3 dores) |
| `list_price` | `numeric` | `null` | Valor de tabela (riscado) |
| `payment_options` | `jsonb` | `'[]'` | Condições de pagamento (opção 1, opção 2...) |
| `testimonial_name` | `text` | `null` | Nome do depoimento |
| `testimonial_role` | `text` | `null` | Cargo do depoimento |
| `testimonial_text` | `text` | `null` | Texto do depoimento |
| `testimonial_image` | `text` | `null` | URL da foto do depoimento |
| `entregaveis` | `jsonb` | `'[]'` | Estrutura completa de entregáveis (output + serviços/checklist) |
| `cases` | `jsonb` | `'[]'` | Cases similares com vimeoId/vimeoHash |
| `whatsapp_number` | `text` | `null` | Número WhatsApp para botão de aprovação |

---

## Etapa 2 — Instalar dependências

- `framer-motion` (provavelmente já existe)
- `react-use-measure` (necessário para o InfiniteSlider)

---

## Etapa 3 — Copiar assets e fontes

- Copiar as 4 fontes Helvetica Now Display (.otf) para `public/fonts/`
- Copiar logos de clientes para `public/logos/` (Logo 1-13.png)
- Copiar `public/bg.png`, `public/Depoimento.png`, `public/icons.svg`, `public/Asset 3.svg`, `public/Asset 10.svg`
- Adicionar `@font-face` no CSS da proposta (scoped, não global)

---

## Etapa 4 — Criar componentes do novo template

Dentro de `src/features/proposals/components/public/`:

1. **ProposalNavbar.tsx** — Barra fixa com countdown baseado em `validity_date`
2. **ProposalHero.tsx** — Hero com bg.png, nome da empresa, efeito de mouse
3. **ProposalClients.tsx** — Slider infinito com logos de clientes (hardcoded — assets da Hiro)
4. **ProposalCases.tsx** — Grid de cases com vídeos Vimeo embed
5. **ProposalObjetivo.tsx** — Diagnóstico + 3 cards de dores
6. **ProposalEntregaveis.tsx** — Seção de entregáveis com checklist de serviços
7. **ProposalInvestimento.tsx** — Card de preço com valor riscado + desconto + depoimento
8. **ProposalProximosPassos.tsx** — Steps visuais + countdown de validade
9. **ProposalDownloadButton.tsx** — Botão flutuante WhatsApp + Print PDF
10. **ProposalFooter.tsx** — Footer minimalista
11. **ProposalGlowSpot.tsx** — Efeito de glow verde decorativo

UI auxiliares (em `src/features/proposals/components/ui/`):
- **InfiniteSlider.tsx** — Slider infinito com framer-motion
- **ProgressiveBlur.tsx** — Blur progressivo
- **ProposalBanner.tsx** — Banner de urgência

---

## Etapa 5 — Nova página pública

Criar `src/features/proposals/components/ProposalPublicPageV2.tsx` que compõe todas as seções na ordem:

```
Navbar → Hero → Clients → Divider → Objetivo → Cases → Entregáveis → Divider → Investimento (com gradient animado) → Próximos Passos (com vídeo de fundo) → Footer
```

Cada seção recebe os dados da proposta do Supabase via props. Campos que não existem na proposta usam valores default ou são omitidos.

---

## Etapa 6 — Atualizar rota e hook

- Atualizar `ProposalPublicPage` para renderizar o novo template (V2)
- Atualizar `useProposalDetails` para mapear os novos campos
- Atualizar `Proposal` type com os novos campos opcionais

---

## Etapa 7 — Atualizar formulário de criação

No `ProposalWizard`, adicionar campos para:
- Diagnóstico (objetivo + 3 dores com label/título/descrição)
- Valor de tabela (`list_price`) para o efeito de preço riscado
- Opções de pagamento estruturadas
- Depoimento (nome, cargo, texto, imagem)
- Entregáveis com estrutura de output + checklist de serviços
- Cases (vimeoId, título, tipo)
- Número WhatsApp

---

## Etapa 8 — CSS scoped para proposta

Adicionar as regras CSS específicas (font-face Helvetica Now Display, `.content-px`, animações de gradient, regras de print) de forma scoped para a página pública, sem afetar o resto do Hiro OS.

---

## Retrocompatibilidade

- Todos os novos campos são nullable/opcionais
- Propostas antigas continuam funcionando — seções sem dados são omitidas
- O `useProposalDetails` já faz fallback com arrays vazios

---

## Detalhes técnicos

- **Fontes**: As fontes Helvetica Now Display são carregadas apenas na página pública via CSS scoped
- **framer-motion**: Usado no InfiniteSlider, ProgressiveBlur e animações de entrada
- **react-use-measure**: Dependência do InfiniteSlider para medir largura do container
- **Vimeo embeds**: Usados como background em Cases e Próximos Passos (muted, autoplay, background mode)
- **Print**: CSS `@media print` com `.no-print` para ocultar navbar, botões, etc.

