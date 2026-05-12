import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { type MarketingPersona } from '@/hooks/useMarketingPersonas';
import { StatusPill } from '@/ds/components/StatusPill';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona: MarketingPersona | null;
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4
        style={{
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: 500,
          color: 'hsl(var(--ds-fg-3))',
          marginBottom: 8,
        }}
      >
        {title}
      </h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((it) => (
          <span key={it} className="pill muted">
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MarketingPersonaDetailsDialog({ open, onOpenChange, persona }: Props) {
  if (!persona) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar style={{ width: 56, height: 56 }}>
              <AvatarImage src={persona.avatar_url || undefined} alt={persona.name} />
              <AvatarFallback>
                {persona.name ? persona.name.charAt(0).toUpperCase() : <User size={20} strokeWidth={1.5} />}
              </AvatarFallback>
            </Avatar>
            <div style={{ textAlign: 'left' }}>
              <DialogTitle style={{ fontFamily: '"HN Display", sans-serif', fontSize: 20 }}>
                {persona.name}
              </DialogTitle>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {persona.segment && <StatusPill label={persona.segment} tone="muted" />}
                {persona.company_size && <StatusPill label={persona.company_size} tone="muted" />}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 8 }}>
          {persona.description && (
            <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', lineHeight: 1.5 }}>
              {persona.description}
            </p>
          )}
          <Section title="Principais dores" items={persona.main_pains} />
          <Section title="Objeções comuns" items={persona.common_objections} />
          <Section title="Gatilhos de compra" items={persona.buying_triggers} />
          <Section title="Canais consumidos" items={persona.channels_consumed} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
