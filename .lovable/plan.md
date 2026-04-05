

# Replace inline empty states in TaskDetails.tsx

## File: `src/pages/TaskDetails.tsx`

### 1. Add imports (line 3 area)
- Add `CheckSquare, MessageCircle` to lucide-react imports (`Link` conflicts with react-router, use `Link2` already imported or keep `ExternalLink`)
- Add `import { EmptyState } from '@/components/ui/empty-state';`

Note: `Link` from lucide-react may conflict with react-router. Will use `Link2` (already imported) for the external links empty state.

### 2. Three replacements

| Line | Current | Replacement |
|------|---------|-------------|
| 329 | `<p className="text-muted-foreground text-sm">Nenhuma subtarefa</p>` | `<EmptyState icon={CheckSquare} title="Nenhuma subtarefa" description="Nenhuma subtarefa." compact />` |
| 384 | `<p className="text-muted-foreground text-sm">Nenhum comentário</p>` | `<EmptyState icon={MessageCircle} title="Nenhum comentário" description="Nenhum comentário." compact />` |
| 455 | `<p className="text-muted-foreground text-sm mb-4">Nenhum link externo</p>` | `<EmptyState icon={Link2} title="Nenhum link externo" description="Nenhum link externo." compact />` |

### 3. No other changes

