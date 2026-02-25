

# Alinhar Visual da Proposta com o Guideline do Site hiro.film

## Analise do Site Institucional

Analisando o site https://hiro.film/, identifiquei os seguintes padroes de design:

**Cores e Fundo**
- Fundo preto puro (`#000` ou muito proximo), nao cinza escuro como o atual `#111113`
- Verde neon como cor de destaque (`#4CFF5C` — confirmado no SVG do logo)
- Textos brancos com variantes de opacidade para hierarquia
- Linhas/bordas em `white/10` para separacao sutil

**Tipografia**
- Titulos grandes e bold, sem serif
- Labels e subtitulos em uppercase com tracking largo
- Corpo de texto em cor branca com opacidade reduzida (~60-70%)
- Dados informativos em layout "label esquerda / valor direita" com linha separadora (como visto em "Hiro Films — 01", "Ano de fundacao — 2022")

**Header (Navbar)**
- Fundo transparente sobre o preto
- Logo HIROヒロシ a esquerda (ja temos o SVG)
- Nav links: "Sobre nos", "Cases" (texto branco, sem decoracao)
- Icone de bandeira verde (Spotify/BR flag) — no nosso caso usamos Instagram verde
- Botao "Contato" com borda branca arredondada (pill shape)
- Sem backdrop-blur pesado — fundo mais transparente

**Layout de Secoes**
- Secoes separadas por linhas finas (`border-white/10`)
- Layout "label : valor" em row com justify-between (ex: "Total de projetos: 200")
- Espacamento generoso, muito ar entre elementos
- Cantos arredondados sutis em cards de imagem

**Footer do Site**
- Informacoes em grid: coordenadas, telefone, email, endereco
- "HIRO.FILM @HIROFILM" como label de marca
- Logo grande na parte inferior

## Alteracoes Planejadas

### 1. Cor de fundo global da proposta: `#0A0A0A` (mais proximo do preto puro do site)

**Arquivo**: Todos os componentes da proposta + `ProposalPublicPage.tsx`
- Trocar `bg-[#111113]` por `bg-[#0A0A0A]` em todos os componentes
- Isso afeta: ProposalPublicPage, HeroSection, UrgencyBar (backgrounds), TimelineSection (dot bg)

### 2. ProposalHeader — Ajustar para ficar mais proximo do site

**Arquivo**: `src/features/proposals/components/ProposalHeader.tsx`
- Remover `backdrop-blur-md` e `border-b` — no site o header e mais limpo
- Fundo: `bg-[#0A0A0A]/95` (sem blur pesado)
- Links "Sobre nos" e "Cases" apontando para `https://hiro.film/about-us` e `https://hiro.film/cases`
- Manter icone Instagram verde e botao "Contato" com borda pill
- Ajustar link do WhatsApp: `https://wa.me/message/LUZWJIF3YEWND1` (mesmo do site)

### 3. HeroSection — Refinar para alinhar com guideline

**Arquivo**: `src/features/proposals/components/HeroSection.tsx`
- Fundo `bg-[#0A0A0A]` em vez de `bg-[#111113]`
- Grid pattern: manter, mas reduzir opacidade para `opacity-[0.03]`
- Gradiente verde: usar `#4CFF5C` (verde neon do logo) em vez de `rgba(34,197,94,...)`
- Metadados no rodape: adotar o pattern "label esquerda / valor direita" com linhas separadoras, similar ao site (ex: "Responsavel ———— Lucas Oliveira")
- Manter tipografia gigante do nome do cliente

### 4. Secoes de conteudo — Padronizar separadores e tipografia

**Arquivos**: AboutSection, BriefingSection, ScopeSection, TimelineSection, InvestmentSection
- Trocar `border-white/5` por `border-white/10` (mais visivel, como no site)
- Labels de secao: manter uppercase tracking wide, mas usar `text-green-400` (ou `text-[#4CFF5C]`) em vez de `text-white/30` para alinhar com o verde do brand
- Garantir espacamento generoso (py-20 em vez de py-16)

### 5. FloatingActions — Usar verde neon do brand

**Arquivo**: `src/features/proposals/components/FloatingActions.tsx`
- Botao "Aprovar Orcamento": `bg-[#4CFF5C] text-black` (verde neon com texto preto, como o accent do site)
- Botao "PDF": manter estilo ghost com borda

### 6. InvestmentSection — Desconto com verde neon

**Arquivo**: `src/features/proposals/components/InvestmentSection.tsx`
- Badge de desconto: usar `bg-[#4CFF5C]/20 text-[#4CFF5C]`

## Resumo de Arquivos

| Arquivo | Alteracao |
|---|---|
| `ProposalPublicPage.tsx` | Fundo `#0A0A0A` |
| `ProposalHeader.tsx` | Limpar blur, atualizar links para hiro.film, WhatsApp correto |
| `HeroSection.tsx` | Fundo `#0A0A0A`, verde neon `#4CFF5C`, metadados refinados |
| `AboutSection.tsx` | Borda `white/10`, label verde, py-20 |
| `BriefingSection.tsx` | Borda `white/10`, label verde, py-20 |
| `ScopeSection.tsx` | Borda `white/10`, label verde, py-20 |
| `TimelineSection.tsx` | Borda `white/10`, label verde, py-20, dot bg `#0A0A0A` |
| `InvestmentSection.tsx` | Borda `white/10`, label verde, py-20, badge verde neon |
| `FloatingActions.tsx` | Botao verde neon `#4CFF5C` com texto preto |
| `ShowcaseSection.tsx` | py-20 |
| `UrgencyBar.tsx` | Sem alteracao (ja tem estilo proprio de alerta) |

