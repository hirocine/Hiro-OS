import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { type MarketingReference } from '@/hooks/useMarketingReferences';
import { CATEGORY_OPTIONS, PLATFORM_OPTIONS } from './MarketingReferenceDialog';

interface Props {
  reference: MarketingReference | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (ref: MarketingReference) => void;
  onDelete: (ref: MarketingReference) => void;
}

export function MarketingReferenceLightbox({ reference, onOpenChange, onEdit, onDelete }: Props) {
  if (!reference) return null;
  const platformLabel = PLATFORM_OPTIONS.find((p) => p.value === reference.platform)?.label;
  const categoryLabel = CATEGORY_OPTIONS.find((c) => c.value === reference.category)?.label;

  return (
    <Dialog open={!!reference} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] max-h-[90vh]">
          <div className="bg-black/90 flex items-center justify-center min-h-[300px] md:min-h-[600px]">
            {reference.image_url ? (
              <img src={reference.image_url} alt={reference.title} className="max-h-[90vh] w-full object-contain" />
            ) : (
              <div className="p-12 text-center text-muted-foreground text-sm">Sem imagem</div>
            )}
          </div>
          <div className="p-6 overflow-y-auto space-y-4">
            <div>
              <h2 className="text-lg font-semibold leading-tight">{reference.title}</h2>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {platformLabel && <Badge variant="secondary">{platformLabel}</Badge>}
                {categoryLabel && <Badge variant="outline">{categoryLabel}</Badge>}
              </div>
            </div>

            {reference.source_url && (
              <a
                href={reference.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline break-all"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                {reference.source_url}
              </a>
            )}

            {reference.tags.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1.5">Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {reference.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {reference.notes && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1.5">Anotações</div>
                <p className="text-sm whitespace-pre-wrap">{reference.notes}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => onEdit(reference)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(reference)}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
