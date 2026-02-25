

# Padding Universal na Proposta (Alinhado ao hiro.film)

## Problema Atual

Cada secao define seu proprio padding horizontal (`px-6`) e depois usa `max-w-*xl mx-auto` para centralizar o conteudo. Isso cria inconsistencia: o header tem `px-6 sm:px-10 lg:px-16` enquanto as secoes tem apenas `px-6` com max-width variavel (3xl, 4xl, 5xl). No site hiro.film, todo o conteudo respeita um padding lateral uniforme.

## Solucao

Definir um padding horizontal universal no wrapper `proposal-content` em `ProposalPublicPage.tsx` e remover o `px-6` individual de cada secao. Tambem remover os `max-w-*xl mx-auto` dos wrappers internos para que o conteudo ocupe toda a largura disponivel dentro do padding, como no site institucional.

## Alteracoes

### 1. `ProposalPublicPage.tsx`
- Adicionar classe de padding universal no div `proposal-content`: `px-6 sm:px-10 lg:px-16`
- Adicionar `max-w-7xl mx-auto` no wrapper para limitar largura total (consistente com o header)

### 2. Remover `px-6` de cada secao:
- **`AboutSection.tsx`**: Remover `px-6`, remover `max-w-3xl mx-auto`
- **`BriefingSection.tsx`**: Remover `px-6`, remover `max-w-5xl mx-auto` do wrapper externo (manter `max-w-3xl mx-auto` no texto do briefing para legibilidade)
- **`ScopeSection.tsx`**: Remover `px-6`, remover `max-w-3xl mx-auto`
- **`TimelineSection.tsx`**: Remover `px-6`, remover `max-w-3xl mx-auto`
- **`InvestmentSection.tsx`**: Remover `px-6`, remover `max-w-2xl mx-auto`
- **`ShowcaseSection.tsx`**: Remover `px-6`, remover `max-w-4xl mx-auto`

### 3. `HeroSection.tsx`
- Manter com padding proprio (fullscreen, independente do wrapper)

## Detalhes Tecnicos

O padding segue a mesma escala do header e do HeroSection:
- Mobile: `px-6` (24px)
- Tablet: `sm:px-10` (40px)
- Desktop: `lg:px-16` (64px)

O `max-w-7xl` (80rem = 1280px) no container externo garante que em telas muito largas o conteudo nao se espalhe demais, igual ao header.

## Arquivos

| Arquivo | Alteracao |
|---|---|
| `ProposalPublicPage.tsx` | Adicionar padding universal e max-w-7xl no wrapper |
| `AboutSection.tsx` | Remover px-6 e max-w centralizado |
| `BriefingSection.tsx` | Remover px-6 e max-w externo |
| `ScopeSection.tsx` | Remover px-6 e max-w centralizado |
| `TimelineSection.tsx` | Remover px-6 e max-w centralizado |
| `InvestmentSection.tsx` | Remover px-6 e max-w centralizado |
| `ShowcaseSection.tsx` | Remover px-6 e max-w centralizado |

