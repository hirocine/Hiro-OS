import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { type MarketingReference } from '@/hooks/useMarketingReferences';
import { CATEGORY_OPTIONS, PLATFORM_OPTIONS } from './MarketingReferenceDialog';
import { StatusPill } from '@/ds/components/StatusPill';

interface Props {
  reference: MarketingReference | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (ref: MarketingReference) => void;
  onDelete: (ref: MarketingReference) => void;
}

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 8,
};

export function MarketingReferenceLightbox({ reference, onOpenChange, onEdit, onDelete }: Props) {
  if (!reference) return null;
  const platformLabel = PLATFORM_OPTIONS.find((p) => p.value === reference.platform)?.label;
  const categoryLabel = CATEGORY_OPTIONS.find((c) => c.value === reference.category)?.label;

  return (
    <Dialog open={!!reference} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] p-0 overflow-hidden ds-shell">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1fr',
            maxHeight: '90vh',
          }}
        >
          <div
            style={{
              background: '#000',
              display: 'grid',
              placeItems: 'center',
              minHeight: 300,
            }}
          >
            {reference.image_url ? (
              <img
                src={reference.image_url}
                alt={reference.title}
                style={{ maxHeight: '90vh', width: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ padding: 48, color: 'hsl(var(--ds-fg-4))', fontSize: 13 }}>
                Sem imagem
              </div>
            )}
          </div>

          <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2
                style={{
                  fontFamily: '"HN Display", sans-serif',
                  fontSize: 17,
                  fontWeight: 600,
                  color: 'hsl(var(--ds-fg-1))',
                  lineHeight: 1.3,
                }}
              >
                {reference.title}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {platformLabel && <StatusPill label={platformLabel} tone="muted" />}
                {categoryLabel && <StatusPill label={categoryLabel} tone="muted" />}
              </div>
            </div>

            {reference.source_url && (
              <a
                href={reference.source_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: 'hsl(var(--ds-accent))',
                  wordBreak: 'break-all',
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={13} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                <span style={{ textDecoration: 'underline' }}>{reference.source_url}</span>
              </a>
            )}

            {reference.tags.length > 0 && (
              <div>
                <span style={sectionLabel}>Tags</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {reference.tags.map((t) => (
                    <span key={t} className="pill muted" style={{ fontSize: 10 }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {reference.notes && (
              <div>
                <span style={sectionLabel}>Anotações</span>
                <p
                  style={{
                    fontSize: 13,
                    color: 'hsl(var(--ds-fg-2))',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                  }}
                >
                  {reference.notes}
                </p>
              </div>
            )}

            <div
              style={{
                display: 'inline-flex',
                gap: 8,
                paddingTop: 16,
                borderTop: '1px solid hsl(var(--ds-line-2))',
              }}
            >
              <button type="button" className="btn" onClick={() => onEdit(reference)}>
                <Pencil size={13} strokeWidth={1.5} />
                <span>Editar</span>
              </button>
              <button
                type="button"
                className="btn"
                style={{ color: 'hsl(var(--ds-danger))', borderColor: 'hsl(var(--ds-danger) / 0.3)' }}
                onClick={() => onDelete(reference)}
              >
                <Trash2 size={13} strokeWidth={1.5} />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
