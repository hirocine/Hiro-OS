

# Create PPVideoPage — Full Video Detail Page

## Key Issue: Status Mismatch

The user's prompt defines `MACRO_STEPS` with statuses like `'decupagem'`, `'revisao_interna'`, `'revisao_cliente'` — but the current `PPStatus` type only has: `'fila' | 'edicao' | 'color_grading' | 'finalizacao' | 'revisao' | 'entregue'`.

**Solution**: Use the existing 6 statuses for MACRO_STEPS to avoid type errors and breaking the rest of the app. The pipeline will use the current statuses:

```text
MACRO_STEPS: fila → edicao → color_grading → finalizacao → revisao → entregue
```

The `sub_status_index` field already exists in the DB (confirmed in schema). We need to add it to the `PostProductionItem` TypeScript interface.

## Changes

### 1. Update `src/features/post-production/types/index.ts`
- Add `sub_status_index: number | null` and `sub_status: string | null` to `PostProductionItem` interface

### 2. Create `src/features/post-production/components/PPVideoPage.tsx`
A full-page component (not a route page — receives `item` + `onBack` as props).

**Structure**:
- **Header**: Back button, composed title, version badge, client/project/date info, Delete + Save buttons
- **Pipeline card**: Horizontal macro steps (using existing 6 statuses) with sub-steps per stage, advance button
- **Two-column layout below pipeline**:
  - Left (2/3): "Dados do Vídeo" card (client, project, suffix, auto-title, notes) + "Atividade & Versões" card (merged timeline of versions + comments, add version form, comment input)
  - Right (1/3): "Informações" sidebar card (status dropdown, priority dropdown, editor with avatars, due date picker, start date picker, delivered date, time in current stage)

**Sub-steps config** (adapted to existing statuses):
```text
fila: []
edicao: ['Troca de câmeras', 'Zoom / reenquadramento', 'Ritmo e cortes', 'Ajuste de áudio']
color_grading: ['Color grading base', 'Ajustes finos']
finalizacao: ['Trilha sonora', 'Motion graphics', 'Legendas', 'SFX']
revisao: ['Assistir completo', 'Ajustes', 'Aprovação']
entregue: ['Export final', 'Envio ao cliente']
```

**Hooks used**: `usePostProductionMutations`, `usePPVersions`, `usePPComments`, `useUsers`, `useAuthContext`

**Helpers**: Reuses `parseTitle`, `composeTitle`, `getUserAvatarUrl`, `getInitials` from PPDialog (will duplicate locally to keep independence)

### 3. Export from `src/features/post-production/components/index.ts`
- Add `export { PPVideoPage } from './PPVideoPage'`

No routing changes in this step (user said "we'll wire up routing in the next step").

## Technical Details

- Timeline merges `versions` and `comments` arrays sorted by `created_at` desc
- Sub-step clicks toggle completion and persist `sub_status_index` via `updateItem.mutate`
- "Advance stage" button moves to next MACRO_STEP and resets `sub_status_index` to 0
- Date pickers use `pointer-events-auto` on Calendar per project convention
- All date formatting uses `date-fns` with `ptBR` locale

