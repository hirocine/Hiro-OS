import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import { type MarketingPersona } from '@/hooks/useMarketingPersonas';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona: MarketingPersona | null;
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <Badge key={it} variant="secondary">
            {it}
          </Badge>
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
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={persona.avatar_url || undefined} alt={persona.name} />
              <AvatarFallback>
                {persona.name ? persona.name.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <DialogTitle className="text-xl">{persona.name}</DialogTitle>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {persona.segment && <Badge variant="outline">{persona.segment}</Badge>}
                {persona.company_size && <Badge variant="outline">{persona.company_size}</Badge>}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {persona.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{persona.description}</p>
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
