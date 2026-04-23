

# Popular `services` da proposta 548 e capturar screenshot

## Ações

### 1. Gerar JSON `services`
Construir em memória o objeto `ProposalServices` equivalente a `createDefaultServices()`, com IDs UUID v4 estáveis, e aplicar overrides:

**Gravação / Equipe** → `included: true`:
- Filmmaker, Fotógrafo, Produtor, Fotógrafo Fixo Backdrop

**Gravação / Equipamentos** → `included: true`:
- Câmeras (`specification: "Canon C70 + Sony FX3, lente Sigma 24-70mm f/2.8"`, `quantity: 2`)
- Iluminação (`specification: "Kit Aputure 600D + painéis LED"`)
- Áudio
- Drone (`specification: "DJI Mavic 3 Pro"`)

**Pós-produção** → `included: true`:
- Edição (`specification: "Entregas com legenda embutida + versão 9:16"`)
- Motion Graphics, Color Grading, Trilha de Banco

Demais itens: `included: false` (default).

### 2. Persistir no Supabase
`UPDATE orcamentos SET services = '<json>' WHERE slug = '548-grupo-primo-evento-portfel-connect-v1'`

Executado via insert tool (data-only update, não migration).

### 3. Capturar screenshot
- `browser--navigate_to_url` para `https://id-preview--cb7836d9-70aa-4b1d-94bc-634ea66dd16d.lovable.app/orcamento/548-grupo-primo-evento-portfel-connect-v1`
- Scroll até a seção "Serviços / O que está incluso no processo"
- `browser--screenshot` da seção renderizada

### 4. Verificação visual
Conferir no screenshot:
- 3 fases visíveis (Pré-produção **não** aparece, pois zero inclusos)
- Tabela com colunas RECURSO | ESPECIFICAÇÃO | QTD
- Subcategorias "EQUIPE" e "EQUIPAMENTOS" como divisores em Gravação
- Câmeras com `2x`, demais com `1x`
- Specifications populadas onde definidas; células em branco onde não

## Não inclui
- Nenhuma alteração de código.
- Nenhuma alteração em outras propostas.
- Sem avançar pro Passo 3.

## Entrega
Screenshot da seção + confirmação dos checkpoints visuais. Aguardo OK antes do Passo 3.

