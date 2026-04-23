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

export function ProposalServices({ services }: Props) {
  // Filtrar fases visíveis: enabled e com pelo menos 1 item incluso
  const visiblePhases = services.phases.filter((phase) => {
    if (!phase.enabled) return false;
    const hasIncluded = phase.subcategories.some((sub) =>
      sub.items.some((item) => item.included),
    );
    return hasIncluded;
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

      <div className='flex flex-col gap-12'>
        {visiblePhases.map((phase) => {
          const Icon = PHASE_ICONS[phase.id];
          return (
            <div key={phase.id}>
              <div className='flex items-center gap-3 mb-5'>
                <div className='w-7 h-7 rounded-md bg-[#4CFF5C]/10 flex items-center justify-center flex-shrink-0'>
                  <Icon className='w-3.5 h-3.5 text-[#4CFF5C]' />
                </div>
                <h3 className='text-lg font-medium text-[#f0f0f0]'>{phase.name}</h3>
              </div>

              <table className='w-full border-collapse'>
                <thead>
                  <tr className='border-b border-gray-800/60'>
                    <th className='text-left py-3 text-[11px] uppercase tracking-[2px] text-gray-500 font-medium'>
                      Recurso
                    </th>
                    <th className='text-left py-3 text-[11px] uppercase tracking-[2px] text-gray-500 font-medium'>
                      Especificação
                    </th>
                    <th className='text-right py-3 text-[11px] uppercase tracking-[2px] text-gray-500 font-medium w-20'>
                      Qtd
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {phase.subcategories.map((sub, sIdx) => {
                    const includedItems = sub.items.filter((item) => item.included);
                    if (includedItems.length === 0) return null;

                    return (
                      <>
                        {sub.name && (
                          <tr key={`sub-${sIdx}`}>
                            <td
                              colSpan={3}
                              className='pt-5 pb-2 text-[10px] uppercase tracking-[2px] text-gray-500'
                            >
                              {sub.name}
                            </td>
                          </tr>
                        )}
                        {includedItems.map((item) => (
                          <tr
                            key={item.id}
                            className='border-b border-gray-800/40 last:border-b-0'
                          >
                            <td className='py-3 text-[14px] text-[#f0f0f0] align-top'>
                              {item.label}
                            </td>
                            <td className='py-3 text-[13px] text-gray-400 align-top'>
                              {item.specification}
                            </td>
                            <td
                              className='py-3 text-[14px] text-[#f0f0f0] text-right align-top'
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {item.quantity}x
                            </td>
                          </tr>
                        ))}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </section>
  );
}
