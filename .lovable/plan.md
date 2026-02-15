

## Refatoracao completa: 6 problemas identificados

### 1. Centralizar icones sociais (WhatsApp e Instagram)

**Problema**: Os componentes SVG `WhatsAppIcon` e `InstagramIcon` estao copiados identicos em 4 arquivos: `Suppliers.tsx`, `Companies.tsx`, `SupplierDetails.tsx`, `CompanyDetails.tsx`.

**Solucao**: Criar arquivo `src/components/icons/SocialIcons.tsx` exportando ambos os icones. Atualizar os 4 arquivos para importar de la e remover as definicoes locais.

**Arquivos**:
- Criar: `src/components/icons/SocialIcons.tsx`
- Editar: `src/pages/Suppliers.tsx`, `src/pages/Companies.tsx`, `src/pages/SupplierDetails.tsx`, `src/pages/CompanyDetails.tsx`

---

### 2. Centralizar `formatRelativeTime`

**Problema**: Funcao identica copiada em `Equipment.tsx`, `SSDs.tsx`, `Dashboard.tsx` (3 arquivos).

**Solucao**: Adicionar `formatRelativeTime` em `src/lib/utils.ts` (junto ao `formatCurrency` existente). Atualizar os 3 arquivos para importar a funcao centralizada.

**Arquivos**:
- Editar: `src/lib/utils.ts` (adicionar funcao)
- Editar: `src/pages/Equipment.tsx`, `src/pages/SSDs.tsx`, `src/pages/Dashboard.tsx` (substituir por import)

---

### 3. Centralizar `formatCurrency` — eliminar redefinicoes

**Problema**: `formatCurrency` ja existe em `src/lib/utils.ts`, mas e redefinida localmente em:
- `src/pages/Suppliers.tsx` (inline)
- `src/pages/Companies.tsx` (inline)
- `src/components/Equipment/EquipmentDetailsDialog.tsx` (inline)
- `src/components/Equipment/AddEquipmentDialog.tsx` (versao com mascaras de input — caso diferente)

**Solucao**: Nos 3 primeiros arquivos, remover a funcao local e importar de `@/lib/utils`. O `AddEquipmentDialog` usa uma versao diferente (formatacao de input com mascara), que deve ser mantida local ou renomeada para `formatCurrencyInput`.

**Arquivos**:
- Editar: `src/pages/Suppliers.tsx`, `src/pages/Companies.tsx`, `src/components/Equipment/EquipmentDetailsDialog.tsx` (substituir por import)

---

### 4. Centralizar `compressImage`

**Problema**: Funcao identica (redimensionar para max 1920x1920, converter para WebP 85%) copiada em 5 arquivos:
- `src/hooks/useEquipmentForm.ts`
- `src/hooks/useImageUpload.ts`
- `src/pages/Equipment.tsx`
- `src/features/platform-accesses/components/PlatformIconPicker.tsx`
- `src/hooks/useAvatarUpload.ts` (versao levemente diferente — aceita `Blob` e opcoes customizadas)

**Solucao**: Criar `src/lib/imageUtils.ts` exportando `compressImage`. Os 4 primeiros arquivos importam dela. O `useAvatarUpload` mantem sua versao propria pois tem interface diferente (aceita `Blob` + opcoes de dimensao customizadas para avatares).

**Arquivos**:
- Criar: `src/lib/imageUtils.ts`
- Editar: `src/hooks/useEquipmentForm.ts`, `src/hooks/useImageUpload.ts`, `src/pages/Equipment.tsx`, `src/features/platform-accesses/components/PlatformIconPicker.tsx` (substituir por import)

---

### 5. Corrigir double fetch em Suppliers e Companies

**Problema**: Os hooks `useSuppliers` e `useCompanies` fazem `fetchSuppliers()` / `fetchCompanies()` automaticamente no `useEffect` de montagem (sem filtros). Depois, as paginas `Suppliers.tsx` e `Companies.tsx` tem outro `useEffect` que chama `fetchSuppliers(filters)` ao mudar filtros — incluindo na montagem inicial (filtros = `{}`). Resultado: **duas requisicoes identicas** ao banco na montagem.

**Solucao**: Remover o `useEffect` automatico dos hooks. A responsabilidade de chamar o fetch fica exclusivamente com a pagina que consome o hook. Adicionar `fetchCompanies()`/`fetchSuppliers()` na montagem das paginas que precisam (ja fazem isso via `useEffect` com `filters`).

**Arquivos**:
- Editar: `src/features/suppliers/hooks/useSuppliers.ts` (remover useEffect)
- Editar: `src/features/supplier-companies/hooks/useCompanies.ts` (remover useEffect)

---

### 6. Adicionar animacoes de entrada nas paginas principais

**Problema**: Apenas `Admin.tsx` tem `animate-fade-in` no conteudo da pagina. Todas as outras paginas aparecem sem transicao.

**Solucao**: Adicionar `className="animate-fade-in"` (ou append ao className existente) no `ResponsiveContainer` raiz de cada pagina principal.

**Paginas a atualizar** (14 arquivos):
- `src/pages/SSDs.tsx` (2 returns: loading + normal)
- `src/pages/Equipment.tsx`
- `src/pages/Tasks.tsx`
- `src/pages/Projects.tsx`
- `src/pages/Suppliers.tsx`
- `src/pages/Companies.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Home.tsx`
- `src/pages/AVProjects.tsx`
- `src/pages/PlatformAccesses.tsx`
- `src/pages/Policies.tsx`
- `src/pages/Profile.tsx`
- `src/pages/AddEquipment.tsx`
- `src/pages/MyTasks.tsx`

---

### Resumo de impacto

| Acao | Arquivos criados | Arquivos editados |
|------|-----------------|-------------------|
| Icones sociais | 1 | 4 |
| formatRelativeTime | 0 | 4 |
| formatCurrency | 0 | 3 |
| compressImage | 1 | 4 |
| Double fetch | 0 | 2 |
| Animacoes | 0 | 14 |
| **Total** | **2** | **~27** (com sobreposicoes) |

Nenhuma nova dependencia. Todas as mudancas usam utilitarios e classes ja existentes no projeto.

