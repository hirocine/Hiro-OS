

# Título do vídeo composto por Empresa + Projeto + Sufixo

## Contexto
O campo `title` atual é livre. O usuário quer que ele seja gerado automaticamente a partir de 3 campos separados, no formato `"Empresa: Projeto - Sufixo"` (ex: "Cacau Show: Campanha de Natal - Criativo 1"). O campo título fica read-only.

A tabela já possui `client_name` (usaremos como "Empresa") e `project_name` (usaremos como "Projeto"). Precisamos de um campo para "Sufixo" -- que pode ser armazenado no campo `title` junto com a composição, ou podemos usar `notes` de outra forma. A abordagem mais simples: **armazenar o sufixo como parte do title gerado e manter os campos `client_name` e `project_name` como fonte de verdade**. O `title` será recomposto sempre que empresa/projeto/sufixo mudar.

## Alterações em `PPDialog.tsx`

### 1. Novos campos de formulário
- Adicionar campo `suffix` ao estado do form (não existe na DB; será extraído/composto localmente)
- Ordem dos campos no dialog:
  1. **Empresa** (input, mapeia para `client_name`)
  2. **Projeto** (input, mapeia para `project_name`)
  3. **Sufixo** (input, novo campo local, ex: "Criativo 1")
  4. **Título do Vídeo** (read-only, gerado automaticamente, exibido com estilo visual distinto -- fundo cinza/disabled)

### 2. Lógica de composição do título
- `useEffect` ou derivação inline que compõe: `[empresa][: projeto][ - sufixo]`
  - Se só empresa: `"Empresa"`
  - Se empresa + projeto: `"Empresa: Projeto"`
  - Se todos: `"Empresa: Projeto - Sufixo"`
- O `title` no form é atualizado automaticamente e enviado ao save

### 3. Edição de itens existentes
- Ao abrir um item existente, fazer parse reverso do title para popular empresa/projeto/sufixo (best-effort: split por `:` e `-`)
- Se o parse falhar (título antigo com formato livre), popular o título inteiro no campo empresa e deixar os outros vazios

### 4. Remover campos antigos
- Remover o campo "Título" editável
- Remover os campos "Projeto" e "Cliente" separados (grid cols-2)
- Substituir pela nova sequência de 3 inputs + preview do título

### 5. Validação
- Pelo menos "Empresa" precisa estar preenchido para habilitar o botão Criar/Salvar (substitui a validação atual de `title.trim()`)

## Arquivo editado
- `src/features/post-production/components/PPDialog.tsx`

