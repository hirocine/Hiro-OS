import type { ProposalServices, Phase, ServiceItem, PhaseId } from '@/lib/services-schema';

/**
 * Helpers puros e imutáveis para mutações em ProposalServices.
 * Todas as funções retornam um novo objeto — nunca mutam o input.
 */

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function makeBlankItem(label = 'Novo item'): ServiceItem {
  return {
    id: crypto.randomUUID(),
    label,
    specification: '',
    quantity: 1,
    included: true,
    isCustom: true,
  };
}

export function setPhaseEnabled(
  services: ProposalServices,
  phaseId: PhaseId,
  enabled: boolean,
): ProposalServices {
  const next = clone(services);
  const phase = next.phases.find((p) => p.id === phaseId);
  if (phase) phase.enabled = enabled;
  return next;
}

export function toggleAllInPhase(
  services: ProposalServices,
  phaseId: PhaseId,
  included: boolean,
): ProposalServices {
  const next = clone(services);
  const phase = next.phases.find((p) => p.id === phaseId);
  if (phase) {
    phase.subcategories.forEach((sub) => {
      sub.items.forEach((it) => (it.included = included));
    });
  }
  return next;
}

export function clearPhaseSpecs(
  services: ProposalServices,
  phaseId: PhaseId,
): ProposalServices {
  const next = clone(services);
  const phase = next.phases.find((p) => p.id === phaseId);
  if (phase) {
    phase.subcategories.forEach((sub) => {
      sub.items.forEach((it) => {
        it.specification = '';
        it.quantity = 1;
      });
    });
  }
  return next;
}

export function updateItem(
  services: ProposalServices,
  phaseId: PhaseId,
  subIdx: number,
  itemId: string,
  patch: Partial<Pick<ServiceItem, 'label' | 'specification' | 'quantity' | 'included'>>,
): ProposalServices {
  const next = clone(services);
  const phase = next.phases.find((p) => p.id === phaseId);
  if (!phase) return next;
  const sub = phase.subcategories[subIdx];
  if (!sub) return next;
  const item = sub.items.find((i) => i.id === itemId);
  if (!item) return next;
  Object.assign(item, patch);
  if (typeof patch.quantity === 'number') {
    item.quantity = Math.max(1, Math.floor(patch.quantity));
  }
  return next;
}

export function addItem(
  services: ProposalServices,
  phaseId: PhaseId,
  subIdx: number,
  label?: string,
): ProposalServices {
  const next = clone(services);
  const phase = next.phases.find((p) => p.id === phaseId);
  if (!phase) return next;
  const sub = phase.subcategories[subIdx];
  if (!sub) return next;
  sub.items.push(makeBlankItem(label || 'Novo item'));
  return next;
}

export function removeItem(
  services: ProposalServices,
  phaseId: PhaseId,
  subIdx: number,
  itemId: string,
): ProposalServices {
  const next = clone(services);
  const phase = next.phases.find((p) => p.id === phaseId);
  if (!phase) return next;
  const sub = phase.subcategories[subIdx];
  if (!sub) return next;
  sub.items = sub.items.filter((i) => i.id !== itemId);
  return next;
}

export function duplicateItem(
  services: ProposalServices,
  phaseId: PhaseId,
  subIdx: number,
  itemId: string,
): ProposalServices {
  const next = clone(services);
  const phase = next.phases.find((p) => p.id === phaseId);
  if (!phase) return next;
  const sub = phase.subcategories[subIdx];
  if (!sub) return next;
  const idx = sub.items.findIndex((i) => i.id === itemId);
  if (idx === -1) return next;
  const orig = sub.items[idx];
  const copy: ServiceItem = {
    ...orig,
    id: crypto.randomUUID(),
    label: orig.isCustom ? `${orig.label} (cópia)` : orig.label,
    isCustom: true,
  };
  sub.items.splice(idx + 1, 0, copy);
  return next;
}

export function getPhase(services: ProposalServices, phaseId: PhaseId): Phase | undefined {
  return services.phases.find((p) => p.id === phaseId);
}
