

# Replace inline empty states with EmptyState component in ProposalDetails.tsx

## Changes in `src/pages/ProposalDetails.tsx`

### 1. Add import
Add `import { EmptyState } from '@/components/ui/empty-state';` near top imports.

### 2. Six replacements

| Lines | Current text | Replacement |
|-------|-------------|-------------|
| 899-905 | `<div>` with AlertTriangle icon + "Nenhuma dor selecionada." + Button | `<EmptyState icon={AlertTriangle} title="Nenhuma dor selecionada" description="Nenhuma dor selecionada." compact action={{ label: "Selecionar do banco de dores", onClick: openDoresBank }} />` |
| 1076-1082 | `<div>` with Briefcase icon + "Nenhum case selecionado." + Button | `<EmptyState icon={Briefcase} title="Nenhum case selecionado" description="Nenhum case selecionado." compact action={{ label: "Selecionar do banco de cases", onClick: openCasesBank }} />` |
| 1131 | `<p>Nenhum case encontrado.</p>` | `<EmptyState icon={Briefcase} title="Nenhum case encontrado" description="Nenhum case encontrado." compact />` |
| 1265-1266 | `<p>Nenhuma entrega adicionada.</p>` | `<EmptyState icon={Package} title="Nenhuma entrega" description="Nenhuma entrega adicionada." compact />` |
| 1427-1431 | `<div>` with MessageSquare icon + "Nenhum depoimento selecionado" | `<EmptyState icon={MessageSquare} title="Nenhum depoimento selecionado" description="Clique em 'Selecionar do Banco' para escolher" compact />` |
| 1506 | `<p>Nenhum depoimento encontrado</p>` | `<EmptyState icon={MessageSquare} title="Nenhum depoimento encontrado" description="Nenhum depoimento encontrado." compact />` |

### 3. Icon imports
Verify `Package` is imported from lucide-react (for entregas). AlertTriangle, Briefcase, MessageSquare should already be imported.

No other changes.

