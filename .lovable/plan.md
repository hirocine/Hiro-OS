

# Redesenhar tela de sucesso do ProposalGuidedWizard

## Arquivo: `src/features/proposals/components/ProposalGuidedWizard.tsx`

### 1. Novo state para proposalId
Ao lado de `generatedSlug` (L135), adicionar:
```tsx
const [generatedProposalId, setGeneratedProposalId] = useState<string | null>(null);
```

Em `handleCreateProposal` (L502), após `setGeneratedSlug(result.slug)`, adicionar:
```tsx
setGeneratedProposalId(result.id);
```

### 2. Substituir tela de sucesso (L516-541)
Remover o bloco atual (ícone verde, h2, p centralizados, min-h, centering) e substituir por:

```tsx
if (generatedSlug) {
  const publicUrl = `${window.location.origin}/orcamento/${generatedSlug}`;
  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full">
      <PageHeader
        title="Proposta Criada"
        subtitle="O link público está pronto para compartilhar com o cliente"
      />

      {/* Preview iframe */}
      <div className="rounded-xl border border-border overflow-hidden" style={{ height: '500px' }}>
        <iframe
          src={`/orcamento/${generatedSlug}?v=${Date.now()}`}
          className="w-full h-full"
          title="Preview da proposta"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end gap-3">
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => copyToClipboard(publicUrl).then(ok => ok && toast.success('Link copiado!'))}>
            <Copy className="h-4 w-4 mr-1" /> Copiar Link
          </Button>
          {generatedProposalId && (
            <Button variant="outline" onClick={() => navigate(`/orcamentos/${generatedProposalId}`)}>
              Editar Proposta
            </Button>
          )}
          <Button onClick={() => window.open(publicUrl, '_blank')}>
            Ver Proposta <ExternalLink className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <a href={publicUrl} target="_blank" rel="noopener noreferrer"
           className="text-xs font-mono text-muted-foreground hover:underline">
          {publicUrl}
        </a>
      </div>
    </div>
  );
}
```

### 3. Imports
Adicionar `Copy`, `ExternalLink` dos lucide-react imports (se não existirem). Verificar se `copyToClipboard` de `@/lib/clipboard` já está importado.

### Arquivos NÃO alterados
Nenhum arquivo em `src/features/proposals/components/public/`.

