

# Adicionar Header/Navbar na Pagina Publica da Proposta

## O que o usuario quer

Baseado na imagem de referencia (screenshot do site da Hiro Films), o usuario quer um header/navbar fixo na pagina publica da proposta com:
- Logo SVG da Hiro (arquivo `Asset_10.svg` enviado) no lado esquerdo
- Links de navegacao no lado direito: "Sobre nos", "Cases", icone Spotify/social verde, botao "Contato" com borda

## Alteracoes

### 1. Copiar o SVG do logo para o projeto
- Copiar `user-uploads://Asset_10.svg` para `src/assets/hiro-logo-full.svg`

### 2. Criar componente `ProposalHeader.tsx`
- **Arquivo**: `src/features/proposals/components/ProposalHeader.tsx`
- Header fixo com fundo escuro (`bg-[#111113]/95 backdrop-blur`) e borda inferior sutil
- Posicionado abaixo da UrgencyBar (precisa considerar o offset)
- Logo SVG a esquerda (importado como componente React ou img)
- Links a direita: "Sobre nos" e "Cases" como links externos para o site da Hiro (https://hirofilms.com.br ou equivalente), icone social verde, e botao "Contato" com borda arredondada
- `z-index: 40` (abaixo da UrgencyBar que e z-50)
- Classe `print:hidden` para nao aparecer no PDF

### 3. Integrar no `ProposalPublicPage.tsx`
- Importar e renderizar `<ProposalHeader />` logo apos a UrgencyBar
- Ajustar o padding-top do conteudo para compensar o header fixo

### 4. Ajustar `HeroSection.tsx`
- Adicionar padding-top para compensar a altura do header fixo (aprox. `pt-16` adicional)
- A barra superior com "Nº / HIRO FILMS / PROPOSTA DE INVESTIMENTO" permanece como esta

### Arquivos

| Arquivo | Alteracao |
|---|---|
| `src/assets/hiro-logo-full.svg` | Novo arquivo — logo SVG da Hiro |
| `src/features/proposals/components/ProposalHeader.tsx` | Novo componente — header/navbar da proposta publica |
| `src/features/proposals/components/ProposalPublicPage.tsx` | Importar e renderizar ProposalHeader |
| `src/features/proposals/components/HeroSection.tsx` | Ajustar padding-top para compensar header |

