

# Redesenhar HeroSection da Proposta Publica

## Referencia Visual

A imagem de referencia mostra um hero fullscreen cinematografico com:
- Fundo escuro com gradiente verde no canto direito
- Grid pattern sutil de quadrados
- Barra superior com 3 colunas: numero do orcamento | HIRO FILMS® | PROPOSTA DE INVESTIMENTO
- Nome do cliente em tipografia gigante (bold, condensed) ocupando o centro
- Barra inferior com metadados: RESPONSAVEL, DATA, VALIDADE (labels em verde, valores em branco)
- Canto inferior esquerdo: elementos decorativos "+ +"
- Canto inferior direito: logo Hiro

## Alteracoes

### `src/features/proposals/components/HeroSection.tsx` — Reescrita completa

**Props necessarias** (expandir para receber dados do proposal):
- `projectName` (ja existe — mas na referencia o nome grande e o CLIENTE, nao o projeto)
- `clientName` (ja existe)
- `projectNumber` (novo)
- `validityDate` (novo)
- `createdAt` (novo)
- `clientResponsible` (novo)

**Novo layout:**

```text
+--------------------------------------------------------------+
| Nº 2025.XXXX      HIRO FILMS®      PROPOSTA DE INVESTIMENTO |
|                                                              |
|                                                              |
|   NOME                                                       |
|   DO CLIENTE          [grid pattern overlay]    [green glow] |
|                                                              |
|                                                              |
| RESPONSÁVEL:    DATA:          VALIDADE:                     |
| Lucas Oliveira  20/04/2023     20/05/2023                    |
|                                                              |
| + +                                    HIROヒロシ.            |
+--------------------------------------------------------------+
```

- Secao fullscreen (`min-h-screen`) com `bg-[#111113]`
- Gradiente verde radial no canto inferior direito (`radial-gradient` posicionado)
- Grid pattern com quadrados (SVG ou CSS, opacidade sutil)
- Barra superior: flex justify-between, texto uppercase tracking wide, `text-white/60`
- Nome do cliente: `text-7xl sm:text-8xl lg:text-[10rem]` font-bold uppercase, tracking-tighter, leading-none
- Barra de metadados: labels em verde (`text-green-400`), valores em branco
- Logo Hiro no canto inferior direito (importar de `src/assets/hiro-logo.png`)
- Elementos decorativos "+ +" no canto inferior esquerdo

### `src/features/proposals/components/ProposalPublicPage.tsx` — Atualizar props

Passar os novos props para `HeroSection`:
```
<HeroSection
  clientName={proposal.client_name}
  projectName={proposal.project_name}
  projectNumber={proposal.project_number}
  validityDate={proposal.validity_date}
  createdAt={proposal.created_at}
  clientResponsible={proposal.client_responsible}
/>
```

### Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `src/features/proposals/components/HeroSection.tsx` | Reescrita completa do layout |
| `src/features/proposals/components/ProposalPublicPage.tsx` | Passar props adicionais ao HeroSection |

