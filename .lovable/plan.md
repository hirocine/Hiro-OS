

# Add AI buttons to ProposalDetails.tsx

## Changes to `src/pages/ProposalDetails.tsx`

### 1. New imports
- `Sparkles, Loader2` from lucide-react
- `useProposalAI` from `@/features/proposals/hooks/useProposalAI`
- Add state: `showTranscriptDialog` (boolean), `transcriptText` (string)

### 2. "Buscar com IA" button (Client section, line ~719)
After the `<Textarea>` for "Descrição da empresa", add a row with a `Button variant="outline" size="sm"`:
- Icon: `Sparkles` (or `Loader2 animate-spin` when loading)
- Text: "Buscar com IA"
- Disabled when `isEnriching || !clientForm.client_name`
- On click: calls `enrichClient(clientForm.client_name)`, sets `clientForm.company_description` with the result, shows `toast.success`. On error: `toast.error`.

### 3. "Importar Transcrição" button (Client section header, line ~708)
Add button next to the "Cliente e Projeto" CardTitle:
- Icon: `Sparkles` / `Loader2`
- Text: "Importar Transcrição"
- Opens a `Dialog` with a `Textarea` for pasting transcript text
- On confirm: calls `parseTranscript(transcriptText)`, fills `clientForm` fields (client_name, project_name, client_responsible), `diagForm.objetivo`, `doresForm`, and `outputForm` with the returned data
- Shows toast feedback

### 4. "Sugerir com IA" button (Dores section, line ~796)
Add button next to the existing "Adicionar Dores" button:
- Icon: `Sparkles` / `Loader2`
- Text: "Sugerir com IA"
- Disabled when `isSuggesting`
- On click: calls `suggestPainPoints(clientForm.client_name, clientForm.project_name, diagForm.objetivo)`, sets `doresForm` with the result, shows toast

### 5. Transcript Dialog
Add a `Dialog` at the bottom of the JSX (before closing `ResponsiveContainer`):
- `open={showTranscriptDialog}` / `onOpenChange={setShowTranscriptDialog}`
- Contains a `Textarea` bound to `transcriptText`
- Footer with Cancel and "Processar" buttons
- "Processar" calls `parseTranscript`, fills fields, closes dialog

No files in `src/features/proposals/components/public/` will be touched.

