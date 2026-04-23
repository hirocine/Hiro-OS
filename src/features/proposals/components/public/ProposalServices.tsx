import { ClipboardList, Clapperboard, Palette, type LucideIcon } from 'lucide-react';
import type { ProposalServices as ProposalServicesType, PhaseId } from '@/lib/services-schema';

const PHASE_ICONS: Record<PhaseId, LucideIcon> = {
  pre_producao: ClipboardList,
  gravacao: Clapperboard,
  pos_producao: Palette,
};

interface Props {
  services: ProposalServicesType;
}

const ROW_GRID = 'grid grid-cols-[210px_1fr_50px] gap-4 items-start';

export function ProposalServices({ services }: Props) {
  // Filtrar fases visíveis: enabled e com pelo menos 1 item incluso
  const visiblePhases = services.phases.filter((phase) => {
    if (!phase.enabled) return false;
    return phase.subcategories.some((sub) => sub.items.some((item) => item.included));
  });

  if (visiblePhases.length === 0) return null;

  return (
    <section className='py-14 md:py-20 proposal-content-px'>
      <p className='text-[11px] uppercase tracking-[4px] text-[#4CFF5C] font-bold mb-5'>
        Serviços
      </p>
      <h2 className='proposal-font-display text-3xl md:text-[42px] font-bold mb-10 leading-tight'>
        O que está incluso no processo
      </h2>

      <div className='max-w-2xl'>
        {visiblePhases.map((phase, phaseIdx) => {
          const Icon = PHASE_ICONS[phase.id];
          const isLast = phaseIdx === visiblePhases.length - 1;
          return (
            <div key={phase.id} className={isLast ? '' : 'mb-10'}>
              <div className='flex items-center gap-3 mb-5'>
                <div className='w-8 h-8 rounded-md bg-[#4CFF5C]/10 flex items-center justify-center flex-shrink-0'>
                  <Icon className='w-4 h-4 text-[#4CFF5C]' />
                </div>
                <h3 className='text-lg font-medium text-[#f0f0f0]'>{phase.name}</h3>
              </div>

              <div>
                {phase.subcategories.map((sub, sIdx) => {
                  const includedItems = sub.items.filter((item) => item.included);
                  if (includedItems.length === 0) return null;

                  return (
                    <div key={sIdx}>
                      {sub.name && (
                        <div className='text-[10px] uppercase tracking-wider text-muted-foreground mt-4 mb-1'>
                          {sub.name}
                        </div>
                      )}
                      {includedItems.map((item) => (
                        <div
                          key={item.id}
                          className={`${ROW_GRID} py-2.5 border-b border-border/40 last:border-b-0`}
                        >
                          <div className='text-[14px] text-[#f0f0f0]'>{item.label}</div>
                          <div className='text-[13px] text-muted-foreground'>
                            {item.specification}
                          </div>
                          <div
                            className='text-[13px] text-muted-foreground text-right'
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {item.quantity}x
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
