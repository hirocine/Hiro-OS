

# Fix PDF upload — extract text with pdfjs-dist + file chip UI

## Files changed

1. `src/features/proposals/components/ProposalGuidedWizard.tsx`

## Changes

### 1. Install `pdfjs-dist`

Run `npm install pdfjs-dist` (or add to package.json).

### 2. New state + imports

- Import `FileIcon, X` from lucide-react
- Add state: `attachedFile: File | null` (default null)
- Add state: `isExtractingPdf: boolean` (default false)

### 3. Replace `handlePdfUpload` (lines 299-309)

New logic:
- Accept `.pdf, .txt, .doc, .docx`
- If `.doc` or `.docx`: show toast "Formato não suportado. Converta para PDF ou cole o texto." and return
- If `.txt`: store in `attachedFile` state only (don't read yet)
- If `.pdf`: store in `attachedFile` state only (don't read yet)
- Reset input value

### 4. New helper: `extractTextFromFile(file: File): Promise<string>`

```ts
const extractTextFromFile = async (file: File): Promise<string> => {
  if (file.name.endsWith('.txt')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.readAsText(file);
    });
  }
  // PDF extraction with pdfjs-dist
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ') + '\n';
  }
  return text;
};
```

### 5. Update `handleAnalyzeBriefing` (line 170-174)

Before calling `analyzeTranscript`:
- If `attachedFile` exists, set `isExtractingPdf = true`, call `extractTextFromFile`, concatenate with textarea text, then proceed
- Set `isExtractingPdf = false` after extraction
- Pass combined text to `analyzeTranscript`

### 6. Update "Analisar" button disabled state (line 590)

Change from `disabled={!transcript.trim()}` to `disabled={!transcript.trim() && !attachedFile}` — allow analyzing with just a file attached.

### 7. File chip UI (between textarea and button bar, lines 569-570)

After the textarea and before the button row, add conditionally:
```tsx
{attachedFile && (
  <div className="flex items-center gap-2 px-3 py-2 border-t border-border">
    <FileIcon className="h-4 w-4 text-muted-foreground" />
    <span className="text-xs text-foreground truncate">{attachedFile.name}</span>
    <span className="text-xs text-muted-foreground">
      ({(attachedFile.size / 1024).toFixed(0)} KB)
    </span>
    <button onClick={() => setAttachedFile(null)} className="ml-auto">
      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
    </button>
  </div>
)}
```

### 8. Update file input accept attribute (line 574)

Change from `.pdf,.txt` to `.pdf,.txt,.doc,.docx`

