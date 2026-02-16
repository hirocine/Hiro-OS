

## Numero Visual Exclusivo para SSDs + Remover Cadastro Direto

### Resumo

Adicionar um campo novo `ssd_number` na tabela `equipments` exclusivo para o controle de SSDs (ex: #01, #02, #03). Esse numero NAO tem relacao com o numero de patrimonio -- e um identificador visual proprio dessa ferramenta. Alem disso, remover o botao "Adicionar SSD" da pagina, ja que os SSDs sao cadastrados pelo inventario.

### O que muda

**1. Novo campo no banco de dados**
- Migration: adicionar coluna `ssd_number` (text, nullable) na tabela `equipments`
- Esse campo so sera usado por itens da categoria Armazenamento que sao SSDs/HDs

**2. Remover cadastro direto de SSDs**
- Remover o botao "Adicionar SSD" e o estado `showAddDialog` da pagina `SSDs.tsx`
- Remover o componente `<AddSSDDialog>` do JSX
- Atualizar subtitulo do PageHeader para orientar que novos itens devem ser cadastrados pelo Inventario
- Deletar `src/components/SSD/AddSSDDialog.tsx`

**3. Editar `ssd_number` pelo dialog de detalhes**
- No `SSDDetailsDialog.tsx`, adicionar um campo de input "Numero do SSD" (ex: 01, 02) logo abaixo do header
- O campo e salvo junto com os demais dados ao clicar "Salvar"
- No header do dialog, exibir `#ssd_number` ao inves de `#patrimonyNumber`

**4. Exibir `ssd_number` no card do Kanban**
- No `SSDCard.tsx`, trocar `ssd.patrimonyNumber` por `ssd.ssd_number` no Badge
- Se nao tiver `ssd_number` preenchido, exibir "Sem numero" ou nao exibir o badge

**5. Atualizar o hook `useSSDs`**
- O `fetchSSDs` ja busca `select('*')`, entao o novo campo vem automaticamente
- Adicionar `ssdNumber: item.ssd_number` no mapeamento do transform

**6. Atualizar o tipo `Equipment`**
- Adicionar `ssd_number?: string` na interface `Equipment` em `src/types/equipment.ts`

### Detalhes Tecnicos

**Arquivos a criar:**
- Migration SQL: `ALTER TABLE equipments ADD COLUMN ssd_number text;`

**Arquivos a editar:**
- `src/pages/SSDs.tsx` -- remover botao, dialog e imports relacionados
- `src/components/SSD/SSDDetailsDialog.tsx` -- adicionar campo de edicao do `ssd_number`, salvar no `updateSSD`, trocar exibicao no header
- `src/components/SSD/SSDCard.tsx` -- trocar `patrimonyNumber` por `ssd_number`
- `src/features/ssds/hooks/useSSDs.ts` -- adicionar `ssd_number` ao mapeamento
- `src/features/ssds/hooks/useSSDDetails.ts` -- incluir `ssd_number` no update
- `src/types/equipment.ts` -- adicionar campo `ssd_number`
- `src/integrations/supabase/types.ts` -- sera atualizado automaticamente pela migration

**Arquivos a deletar:**
- `src/components/SSD/AddSSDDialog.tsx`

### O que NAO muda
- O numero de patrimonio continua funcionando normalmente no inventario
- O formulario de equipamentos (`EquipmentForm.tsx`) nao precisa de alteracao
- O Kanban, drag-and-drop e alocacao de projetos permanecem iguais
- A capacidade (GB) continua sendo preenchida pelo campo `capacity` ja existente

