import { useEffect, useState } from 'react';
import { Check, Loader2, AlertCircle, Cog } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import type { ProposalServices, PhaseId, ServiceItem } from '@/lib/services-schema';
import { useServicesAutosave, type SaveStatus } from '../../hooks/useServicesAutosave';
import {
  setPhaseEnabled,
  toggleAllInPhase,
  clearPhaseSpecs,
  updateItem as updateItemFn,
  addItem as addItemFn,
  removeItem as removeItemFn,
  duplicateItem as duplicateItemFn,
} from '../../lib/services-mutations';
import { PhaseCard } from './PhaseCard';

interface Props {
  proposalId: string;
  proposalSlug: string;
  initialServices: ProposalServices;
}

function StatusBadge({ status }: { status: SaveStatus }) {
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Salvando…
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-success">
        <Check className="h-3 w-3" /> Salvo
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-destructive">
        <AlertCircle className="h-3 w-3" /> Erro ao salvar
      </span>
    );
  }
  return null;
}

export function ServicesEditor({ proposalId, proposalSlug, initialServices }: Props) {
  const [services, setServices] = useState<ProposalServices>(initialServices);
  const { save, status } = useServicesAutosave({ proposalId, proposalSlug });

  // se a prop mudar (refetch), sincroniza — mas só se diferente
  useEffect(() => {
    setServices(initialServices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialServices]);

  const apply = (next: ProposalServices) => {
    setServices(next);
    save(next);
  };

  return (
    <Card className="lg:col-span-2">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-muted">
            <Cog className="h-4 w-4 text-foreground/70" />
          </div>
          <CardTitle className="text-sm font-semibold tracking-tight">
            Serviços (Pré, Gravação, Pós)
          </CardTitle>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="p-6 space-y-3">
        {services.phases.map((phase) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            onTogglePhase={(enabled) => apply(setPhaseEnabled(services, phase.id, enabled))}
            onUpdateItem={(subIdx, itemId, patch) =>
              apply(updateItemFn(services, phase.id, subIdx, itemId, patch))
            }
            onAddItem={(subIdx, label) => apply(addItemFn(services, phase.id, subIdx, label))}
            onRemoveItem={(subIdx, itemId) => apply(removeItemFn(services, phase.id, subIdx, itemId))}
            onDuplicateItem={(subIdx, itemId) =>
              apply(duplicateItemFn(services, phase.id, subIdx, itemId))
            }
            onSelectAll={() => apply(toggleAllInPhase(services, phase.id, true))}
            onUnselectAll={() => apply(toggleAllInPhase(services, phase.id, false))}
            onClearSpecs={() => apply(clearPhaseSpecs(services, phase.id))}
          />
        ))}
      </div>
    </Card>
  );
}
