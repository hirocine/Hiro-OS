

# Visual Polish: ProposalDetails Section Headers

## Single file: `src/pages/ProposalDetails.tsx`

All changes are styling-only. No logic changes.

### 4 changes per section, applied to all 8 sections:

**A. Icon container** — wrap each bare icon:
```
// Before:
<Building2 className="h-4 w-4 text-muted-foreground" />
// After:
<div className="p-1.5 rounded-md bg-muted"><Building2 className="h-4 w-4 text-foreground/70" /></div>
```

**B. CardHeader border** — add `border-b border-border` to every `<CardHeader className="pb-3">` → `<CardHeader className="pb-3 border-b border-border">`

**C. Move save button into CardHeader** — for each section, the conditional `{xDirty && <CardFooter>...<Button>Salvar</Button></CardFooter>}` gets removed; the save button moves inline into the CardHeader's right-side flex container. Sections that already have action buttons (Dores, Cases, Entregas, Depoimento, Client) get the save button appended to their existing button group. Sections without action buttons (Investment, Objective, Serviços) get a new right-side area with just the conditional save button.

**D. CardTitle size** — all `<CardTitle className="text-base">` → `<CardTitle className="text-sm font-semibold tracking-tight">`

### Section-by-section summary:

| Section | Line range | Icon | Has action buttons | Dirty flag |
|---------|-----------|------|--------------------|------------|
| Cliente e Projeto | 696-762 | Building2 | Importar Transcrição | clientDirty |
| Investimento | 764-800 | DollarSign | none | investDirty |
| Objetivo | 802-820 | FileText | none | diagDirty |
| Dores do Cliente | 822-886 | AlertTriangle | Sugerir IA + Adicionar | doresDirty |
| Cases / Portfólio | 1012-1071 | Briefcase | Adicionar Cases | casesDirty |
| Entregas (Output) | 1205-1276 | Package | Adicionar | outputDirty |
| Serviços Inclusos | 1278-1349 | Package | none | inclusoDirty |
| Depoimento | 1351-1399 | MessageSquare | Selecionar do Banco | testimonialDirty |

### Import cleanup
- Remove `CardFooter` from the import on line 3 (no longer used by any section).

