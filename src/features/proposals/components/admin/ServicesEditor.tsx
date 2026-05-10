import { useEffect, useState } from 'react';
import { Check, Loader2, AlertCircle, Cog } from 'lucide-react';
import type { ProposalServices } from '@/lib/services-schema';
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
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: 'hsl(var(--ds-fg-3))',
        }}
      >
        <Loader2 size={12} strokeWidth={1.5} className="animate-spin" /> Salvando…
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: 'hsl(var(--ds-success))',
        }}
      >
        <Check size={12} strokeWidth={1.5} /> Salvo
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: 'hsl(var(--ds-danger))',
        }}
      >
        <AlertCircle size={12} strokeWidth={1.5} /> Erro ao salvar
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
    <div
      className="lg:col-span-2"
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Cog size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-2))',
            }}
          >
            Serviços (Pré, Gravação, Pós)
          </span>
        </div>
        <StatusBadge status={status} />
      </div>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
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
    </div>
  );
}
