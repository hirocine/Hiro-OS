

# Rewrite PPVideoPage layout with BreadcrumbNav header and rich summary card

## Single file: `src/features/post-production/components/PPVideoPage.tsx`

All logic, hooks, state, handlers, helpers unchanged. Only JSX restructure.

### Import changes
- Add: `BreadcrumbNav` from `@/components/ui/breadcrumb-nav`
- Add: `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger` from `@/components/ui/dropdown-menu`
- Add: `MoreHorizontal` from `lucide-react` (Pencil already imported)
- Keep: `Save, Trash2` (Save used in summary card save button, Trash2 in dropdown)
- `useNavigate` already imported

### 1. Header — BreadcrumbNav + dropdown (lines 236-259)
Replace with ProposalDetails pattern:
- `BreadcrumbNav` with items: `Esteira de Pós` (href `/esteira-de-pos`) > `composedTitle || 'Vídeo'`
- Right side: "Editar" outline button navigating to edit page, then a `DropdownMenu` with `MoreHorizontal` trigger containing "Excluir" as destructive item

### 2. Summary Card — replace current + delete Informações card (lines 262-486)
Replace the current simple summary card AND the entire Informações card with one rich summary card containing:
- **Top row**: title + version badge on left; status + priority badges on right
- **Separator**
- **Bottom grid** (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4`): Status select, Priority select, Editor select, Prazo DateField, Início DateField, Entregue em (read-only), Tempo na etapa (read-only) — each in `space-y-1.5` div
- **Footer row**: right-aligned Save button (shown always, disabled when `!form.client_name.trim()`)

### 3. Pipeline Card — unchanged (lines 287-393)

### 4. Delete the standalone Informações card (lines 395-486)
All its content is now in the summary card.

### 5. Atividade & Versões — unchanged (lines 488-587)

### Technical notes
- The `onBack` prop is no longer used in the header (BreadcrumbNav handles navigation). Keep prop in interface for compatibility but don't render a back button.
- `DropdownMenuSeparator` not needed (only one item in dropdown).

