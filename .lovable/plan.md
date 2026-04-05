

# Ajustes Step 0 — Briefing (textarea + header)

## Arquivo: `src/features/proposals/components/ProposalGuidedWizard.tsx`

### 1. Textarea — botões fixos embaixo (sem absolute)

Replace the textarea container (lines 556-591) to remove `position: absolute` from buttons and instead use a flex column layout:

```tsx
<div className="w-full max-w-2xl">
  <div className="rounded-xl border border-border bg-background flex flex-col">
    <Textarea
      value={transcript}
      onChange={e => setTranscript(e.target.value)}
      placeholder="Cole aqui o resumo da reunião do Google Meet, transcrição ou briefing do projeto..."
      className="min-h-[280px] text-sm border-0 focus-visible:ring-0 scrollbar-thin resize-none rounded-b-none"
    />
    <div className="flex items-center justify-end gap-2 p-3 border-t border-border">
      {/* Anexar + Analisar buttons — same as current, no position absolute */}
    </div>
  </div>
</div>
```

This ensures the textarea scrolls independently and buttons stay in a fixed row below.

### 2. PageHeader no topo

Add a `PageHeader` before the centered content area. The outer wrapper changes from a single centered flex to two sections:

```tsx
{step === 0 && !showQuestions && (
  <div className="space-y-6">
    <PageHeader
      title="Nova Proposta"
      subtitle="Cole o briefing e deixe a IA preencher sua proposta"
    />
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 py-8">
      {/* existing centered content (icon, h1, textarea) */}
    </div>
  </div>
)}
```

Import `PageHeader` from `@/components/ui/page-header` (add to imports if not already present).

## Files changed

1. `src/features/proposals/components/ProposalGuidedWizard.tsx`

No files in `src/features/proposals/components/public/` touched.

