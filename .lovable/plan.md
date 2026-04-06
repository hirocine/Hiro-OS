

# Split PPVideoPage into View + Edit pages

## 4 files to change

### FILE 1 — CREATE `src/features/post-production/components/PPVideoEditForm.tsx`
New component with Props: `{ item: PostProductionItem; onBack: () => void }`.

- Copy helpers from PPVideoPage: `parseTitle`, `composeTitle`, `getUserAvatarUrl`, `getInitials`, `SectionHeader`, `DateField`
- Same hooks: `usePostProductionMutations`, `useUsers`
- Same form state (client_name, project_name, suffix, editor_id, status, priority, due_date, start_date, notes)
- Add `isDirty` computed by comparing form values to original item values
- `handleSave`: calls `updateItem.mutate(...)` then `onBack()`

Layout (matching ProposalDetails card pattern):
```
ResponsiveContainer maxWidth="7xl"
  Header: back button + breadcrumb ("Esteira de Pós" > composedTitle) + no action buttons in header
  Card "Dados do Vídeo" (SectionHeader with FileText icon, save button in header when isDirty):
    - 3-col grid: Empresa, Projeto, Sufixo inputs
    - Título gerado (readonly)
    - Observações textarea
  Card "Informações" (SectionHeader with Info icon, save button when isDirty):
    - 2-col grid: Etapa select, Prioridade select, Editor select, Prazo, Início date pickers
```

### FILE 2 — CREATE `src/pages/PPVideoEditDetail.tsx`
Same structure as `PPVideoDetail.tsx`:
- `useParams` for `:id`, `useNavigate(-1)` for onBack
- `usePostProduction()` to find item
- Loading skeleton, redirect if not found
- Renders `<PPVideoEditForm item={item} onBack={...} />`

### FILE 3 — MODIFY `src/App.tsx`
- Add lazy import: `const PPVideoEditDetail = lazy(() => import("./pages/PPVideoEditDetail"))`
- Add route after `esteira-de-pos/:id`: `<Route path="esteira-de-pos/:id/editar" element={<PPVideoEditDetail />} />`

### FILE 4 — MODIFY `src/features/post-production/components/PPVideoPage.tsx`
Two changes only:
1. **Header**: Add `useNavigate` import, add `const navigate = useNavigate()`. Before the "Excluir" button, add an "Editar" button with `Pencil` icon that navigates to `/esteira-de-pos/${item.id}/editar`. Import `Pencil` from lucide-react.
2. **Remove "Dados do Vídeo" card and grid wrapper**: Delete lines 390-421 (the grid open, left column, and Dados do Vídeo card). Remove the grid wrapper `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">` and the right column `<div>` wrapper — render the Informações `<Card>` directly (full width, no grid). The Informações card content (lines 425-516) stays unchanged but becomes a standalone card. Also remove the `FileText` import if no longer used.

