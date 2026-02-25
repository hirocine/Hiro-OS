

# Plano: Ferramenta de Propostas Comerciais (Orcamentos)

## Resumo

Criar uma ferramenta completa de geracoes de propostas comerciais com duas frentes: um Wizard administrativo (acessivel para roles `admin` e `producao`) e uma pagina publica premium com visual cinematografico acessivel sem login via slug unico.

---

## Parte 1: Banco de Dados

### Nova tabela `orcamentos`

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK, gen_random_uuid() |
| slug | text | UNIQUE, gerado a partir do projeto (ex: hiro-burger-king-2026) |
| client_name | text | NOT NULL |
| project_name | text | NOT NULL |
| project_number | text | Nullable |
| client_responsible | text | Nullable |
| validity_date | date | NOT NULL |
| briefing | text | Nullable |
| video_url | text | Nullable (YouTube/Vimeo) |
| moodboard_images | jsonb | Array de URLs do Storage |
| scope_pre_production | jsonb | Array de {item: string} |
| scope_production | jsonb | Array de {item: string} |
| scope_post_production | jsonb | Array de {item: string} |
| timeline | jsonb | Array de {week: string, description: string} |
| base_value | numeric | Subtotal |
| discount_pct | numeric | 0-100 |
| final_value | numeric | Calculado |
| payment_terms | text | Default: "50% no fechamento e 50% na entrega" |
| status | text | Default: 'draft' (draft, sent, approved, expired) |
| created_by | uuid | Nullable |
| created_at | timestamptz | Default: now() |
| updated_at | timestamptz | Default: now() |

### RLS Policies

- **SELECT publico (anon)**: Permitir leitura para qualquer pessoa (`true`) - necessario para a pagina publica funcionar sem login.
- **INSERT/UPDATE/DELETE**: Apenas `admin` e `producao`.

### Storage Bucket

- Criar bucket `proposal-moodboard` (publico) para as imagens do moodboard.
- RLS: Upload restrito a usuarios autenticados com role admin/producao; leitura publica.

---

## Parte 2: Wizard de Criacao (Admin)

### Rota e Navegacao

- Rota: `/orcamentos` (listagem) e `/orcamentos/novo` (wizard).
- Item "Orcamentos" adicionado na secao **Producao** da sidebar (acessivel para admin e producao), com icone `FileText` ou `Receipt`.

### Estrutura do Wizard (4 Steps)

Utilizar o padrao de stepper ja existente no projeto (similar ao `NewProjectWizard`), com progress bar e navegacao anterior/proximo.

**Step 1 - Dados Basicos:**
- Nome do Cliente (Input)
- Nome do Projeto (Input)
- Numero do Projeto (Input, opcional)
- Responsavel pelo Cliente (Input)
- Data de Validade (DatePicker com Popover/Calendar)

**Step 2 - Midia e Contexto:**
- Briefing (Textarea, campo longo)
- URL do Video Reel (Input, YouTube/Vimeo)
- Upload Multiplo de Moodboard (reutilizar padrao do `useImageUpload`, adaptado para bucket `proposal-moodboard`)

**Step 3 - Escopo e Cronograma:**
- Escopo: 3 listas dinamicas (Pre-Producao, Producao, Pos-Producao) com botoes "Adicionar item" / "Remover item"
- Cronograma: Lista dinamica de pares {Semana/Data, Descricao da Etapa} com adicionar/remover

**Step 4 - Investimento:**
- Valor Base / Subtotal (Input numerico, formatado em BRL)
- Desconto % (Input numerico, 0-100)
- Condicoes de Pagamento (Textarea, pre-preenchido com "50% no fechamento e 50% na entrega")
- Preview automatico do valor final: mostra subtotal, desconto aplicado e valor final calculado em tempo real

**Acao Final:** Botao "Gerar Proposta" que:
1. Faz upload das imagens do moodboard para o Storage
2. Gera o slug automaticamente (ex: `hiro-burger-king-2026`)
3. Salva na tabela `orcamentos`
4. Redireciona ou exibe o link publico gerado (`/orcamento/[slug]`)

### Pagina de Listagem (`/orcamentos`)

- Grid de cards mostrando propostas existentes com: nome do projeto, cliente, status (badge), data de validade, link para copiar.
- Filtros por status.

---

## Parte 3: Pagina Publica da Proposta (Client View)

### Rota

- `/orcamento/:slug` - rota publica, fora do `<ProtectedRoute>` e do `<Layout>`.
- Visual dark mode forcado (cinza chumbo/preto), independente do tema do app.

### Estrutura da Pagina

1. **Barra de Urgencia (Topo):** Faixa fina fixa com countdown calculado a partir de `validity_date`. Ex: "Esta proposta expira em X dias". Se expirada, mostra "Proposta expirada".

2. **Hero Section:** Nome do projeto e cliente em destaque com tipografia grande. Fundo com overlay escuro sutil.

3. **Quem Somos:** Texto "A HIRO e um studio de producao audiovisual especializado em conteudo criativo". Infinite marquee horizontal com logos/nomes: Burger King, Kopenhagen, Porsche, SPFW, Grupo Primo, Pandora, Beyoung.

4. **Showcase (Video):** Player embutido do YouTube/Vimeo em container elegante sem bordas. Extrair o embed URL automaticamente da URL fornecida.

5. **Briefing & Moodboard:** Texto do briefing formatado. Grade masonry com as imagens do moodboard. Lightbox fullscreen ao clicar.

6. **Escopo:** Accordion com 3 abas (Pre-Producao, Producao, Pos-Producao). Cada aba expande para mostrar a lista de itens.

7. **Cronograma:** Timeline vertical animada mostrando semana/data e descricao de cada etapa.

8. **Investimento:** Secao estilo SaaS. Se houver desconto: valor base riscado, badge "X% OFF", valor final em destaque. Abaixo, texto das condicoes de pagamento.

9. **Floating Actions (CTAs):** Fixos na parte inferior:
   - Botao primario "Aprovar Orcamento" -> abre WhatsApp (+5511951513862) com mensagem pre-formatada
   - Botao secundario "Exportar em PDF"

### Exportacao PDF

- Usar `jsPDF` (ja instalado) ou `html2pdf.js` para gerar PDF limpo formato A4.
- Na versao PDF: ocultar barra de urgencia, botoes flutuantes e player de video. Ajustar layout para impressao.

---

## Parte 4: Arquitetura de Arquivos

```text
src/features/proposals/
  components/
    ProposalWizard.tsx          # Wizard 4 steps
    ProposalCard.tsx             # Card para listagem
    ProposalFilters.tsx          # Filtros da listagem
    ProposalPublicPage.tsx       # Pagina publica completa
    UrgencyBar.tsx               # Countdown no topo
    HeroSection.tsx              # Hero com nome do projeto
    AboutSection.tsx             # Quem Somos + Marquee
    ShowcaseSection.tsx          # Video embed
    BriefingSection.tsx          # Briefing + Moodboard + Lightbox
    ScopeSection.tsx             # Accordion de escopo
    TimelineSection.tsx          # Timeline do cronograma
    InvestmentSection.tsx        # Preco com desconto
    FloatingActions.tsx          # CTAs fixos
    index.ts
  hooks/
    useProposals.ts              # CRUD com Supabase
    useProposalDetails.ts        # Fetch por slug
  types/
    index.ts
  index.ts

src/pages/
  Proposals.tsx                  # Listagem (protegida)
  NewProposal.tsx                # Wizard (protegida)  
  ProposalPublic.tsx             # Pagina publica (sem auth)
```

### Alteracoes em Arquivos Existentes

- **`src/App.tsx`**: Adicionar rota `/orcamento/:slug` FORA do ProtectedRoute. Adicionar rotas `/orcamentos` e `/orcamentos/novo` dentro do layout protegido.
- **`src/components/Layout/Sidebar.tsx`**: Adicionar item "Orcamentos" na secao Producao.
- **`src/components/Layout/DesktopSidebar.tsx`** e **`MobileSidebar.tsx`**: Mesmo item de navegacao.

---

## Detalhes Tecnicos

- **Slug**: Gerado como `hiro-${clientName}-${projectName}-${year}` normalizado (lowercase, sem acentos, hifens). Verificacao de unicidade antes de salvar.
- **WhatsApp CTA**: `https://wa.me/5511951513862?text=Olá! Gostaria de aprovar o orçamento do projeto [NOME_PROJETO].`
- **Marquee**: CSS animation com `@keyframes` e `translateX`, duplicando os itens para loop infinito.
- **Lightbox**: Implementado com Dialog fullscreen do Radix.
- **Masonry Grid**: CSS columns ou grid com `grid-template-rows: masonry` (fallback com columns).
- **Timeline**: Componente customizado com linha vertical e pontos/circulos animados com intersection observer.
- **Video Embed**: Parser para converter URLs do YouTube (`watch?v=` / `youtu.be/`) e Vimeo em URLs de embed.
- **PDF Export**: Esconder elementos com classe CSS `print:hidden`, usar `window.print()` como fallback simples ou `jsPDF` com `html2canvas` para maior controle.

