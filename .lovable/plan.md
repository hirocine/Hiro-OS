

# Separar Entregáveis e Serviços Inclusos em estados independentes

## Problema

Atualmente, "Entregas (Output)" e "Serviços Inclusos" compartilham:
- O mesmo estado (`entregaveisForm` com `{ entregaveis, incluso_categories }`)
- O mesmo snapshot e dirty check (`entregaveisDirty`)
- O mesmo `saveSection('entregaveis')` que salva os dois juntos

Isso significa que ao alterar apenas um entregável, o botão "Salvar Serviços" também aparece (e vice-versa), e salvar um sempre salva o outro junto.

## Solução

Separar em dois estados, dois snapshots, dois dirty checks e duas ações de save independentes. Ambos continuam salvando no mesmo campo `entregaveis` do banco (formato de blocos), mas cada seção controla apenas seu bloco.

## Alterações

**Arquivo: `src/pages/ProposalDetails.tsx`**

1. **Estado**: Substituir `entregaveisForm: EntregaveisData` por dois estados separados:
   - `outputForm: EntregavelItem[]` (entregas)
   - `inclusoForm: InclusoCategory[]` (serviços)
   - Dois snapshots: `outputSnapshot` e `inclusoSnapshot`

2. **Parsing (useEffect)**: Popular cada estado separadamente a partir dos blocos do banco

3. **Dirty checks**: Dois `useMemo` independentes — `outputDirty` e `inclusoDirty`

4. **Save**: Dois handlers ou adaptar `saveSection` com `'output'` e `'incluso'`. Ambos reconstroem o array de blocos completo ao salvar (lendo o estado atual do outro para não sobrescrever)

5. **UI**: Atualizar referências de `entregaveisForm.entregaveis` para `outputForm` e `entregaveisForm.incluso_categories` para `inclusoForm`. Botões de salvar condicionados ao respectivo dirty check

