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

const ROW_GRID = 'grid grid-cols-[180px_1fr_40px] gap-5 items-start';

function toSentenceCase(s: string) {
  if (!s) return s;
  const lower = s.toLocaleLowerCase('pt-BR');
  return lower.charAt(0).toLocaleUpperCase('pt-BR') + lower.slice(1);
}

export function ProposalServices({ services }: Props) {
  // Filtrar fases visíveis: enabled e com pelo menos 1 item incluso
  const visiblePhases = services.phases.filter((phase) => {
    if (!phase.enabled) return false;
    return phase.subcategories.some((sub) => sub.items.some((item) => item.included));
  });

  if (visiblePhases.length === 0) return null;

  const colDivider = { borderLeft: '0.5px solid rgba(255, 255, 255, 0.06)', paddingLeft: '20px' };
  const headerColDivider = {
    borderLeft: '0.5px solid rgba(255, 255, 255, 0.08)',
    paddingLeft: '20px',
  };

  return (
    <section className='py-14 md:py-20 proposal-content-px'>
      <p className='text-[11px] uppercase tracking-[4px] text-[#4CFF5C] font-bold mb-5'>
        Serviços
      </p>
      <h2 className='proposal-font-display text-3xl md:text-[42px] font-bold mb-10 leading-tight'>
        O que está incluso no processo
      </h2>

      <div className='w-full flex flex-col gap-4'>
        {visiblePhases.map((phase) => {
          const Icon = PHASE_ICONS[phase.id];
          return (
            <div
              key={phase.id}
              className='rounded-2xl border'
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.025)',
                borderColor: 'rgba(255, 255, 255, 0.07)',
                padding: '24px 28px',
              }}
            >
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-8 h-8 rounded-md bg-[#4CFF5C]/10 flex items-center justify-center flex-shrink-0'>
                  <Icon className='w-4 h-4 text-[#4CFF5C]' />
                </div>
                <h3 className='text-lg font-medium text-[#f0f0f0]'>{phase.name}</h3>
              </div>

              {/* Headers de coluna */}
              <div
                className={`${ROW_GRID} py-2`}
                style={{ borderBottom: '0.5px solid rgba(255, 255, 255, 0.1)' }}
              >
                <div
                  className='text-[10px] uppercase text-muted-foreground font-medium'
                  style={{ letterSpacing: '0.14em' }}
                >
                  Recurso
                </div>
                <div
                  className='text-[10px] uppercase text-muted-foreground font-medium'
                  style={{ letterSpacing: '0.14em', ...headerColDivider }}
                >
                  Especificação
                </div>
                <div
                  className='text-[10px] uppercase text-muted-foreground font-medium text-right'
                  style={{ letterSpacing: '0.14em', ...headerColDivider }}
                >
                  Qtd
                </div>
              </div>

              <div>
                {phase.subcategories.map((sub, sIdx) => {
                  const includedItems = sub.items.filter((item) => item.included);
                  if (includedItems.length === 0) return null;

                  return (
                    <div key={sIdx}>
                      {sub.name && (
                        <div
                          className='text-[11px] font-medium'
                          style={{
                            color: 'rgba(255, 255, 255, 0.35)',
                            marginTop: '16px',
                            marginBottom: '2px',
                          }}
                        >
                          {toSentenceCase(sub.name)}
                        </div>
                      )}
                      {includedItems.map((item, iIdx) => (
                        <div
                          key={item.id}
                          className={`${ROW_GRID} py-2.5`}
                          style={
                            iIdx === includedItems.length - 1
                              ? undefined
                              : { borderBottom: '0.5px solid rgba(255, 255, 255, 0.08)' }
                          }
                        >
                          <div className='text-[14px] text-[#f0f0f0]'>{item.label}</div>
                          <div className='text-[13px] text-muted-foreground' style={colDivider}>
                            {item.specification}
                          </div>
                          <div
                            className='text-[13px] text-muted-foreground text-right'
                            style={{ fontVariantNumeric: 'tabular-nums', ...colDivider }}
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
