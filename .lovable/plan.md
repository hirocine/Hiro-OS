

# Redesenhar chip do arquivo anexado — estilo Claude

## Arquivo: `src/features/proposals/components/ProposalGuidedWizard.tsx`

### Mudança

Move the file chip from inside the textarea container (lines 609-620) to **above** the textarea container (between `<>` on line 600 and the `<div className="w-full max-w-2xl">` on line 601).

**Remove** lines 609-620 (the current chip inside the textarea border).

**Add** before line 601, the new Claude-style card:

```tsx
{attachedFile && (
  <div className="w-full max-w-2xl">
    <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/50 max-w-xs">
      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
        <FileIcon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachedFile.name}</p>
        <p className="text-xs text-muted-foreground">
          {(attachedFile.size / (1024 * 1024)).toFixed(2)}MB · {attachedFile.name.split('.').pop()?.toUpperCase()}
        </p>
      </div>
      <button onClick={() => setAttachedFile(null)} className="flex-shrink-0 p-1 rounded-md hover:bg-muted">
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  </div>
)}
```

The button bar (Anexar + Analisar) stays clean without the chip. No other files changed.

