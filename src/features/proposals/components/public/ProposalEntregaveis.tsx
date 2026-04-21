import { Video, Smartphone, Camera, ClipboardList, Clapperboard, Palette, Check, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  'Vídeo principal': Video,
  'Cortes para redes sociais': Smartphone,
  'Fotos de bastidores': Camera,
  'ClipboardList': ClipboardList,
  'Clapperboard': Clapperboard,
  'Palette': Palette,
}

function CheckItem({ nome, ativo, quantidade }: { nome: string; ativo: boolean; quantidade?: string }) {
  return (
    <div className={`flex items-center gap-2.5 py-1.5 ${ativo ? 'text-[#f0f0f0]' : 'text-gray-600'}`}>
      <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
        ativo ? 'bg-[#4CFF5C]/15 text-[#4CFF5C]' : 'bg-gray-800 text-gray-600'
      }`}>
        {!ativo ? <X className='w-3 h-3' /> : quantidade ? <span className='text-[10px] font-bold'>{quantidade}</span> : <Check className='w-3 h-3' />}
      </div>
      <span className='text-[13px]'>{nome}</span>
      <span className={`text-[9px] uppercase tracking-[1.5px] px-2 py-0.5 rounded-full ml-auto ${
        ativo ? 'text-[#4CFF5C]/60 bg-[#4CFF5C]/10' : 'text-gray-600 bg-gray-800/50'
      }`}>
        {ativo ? 'Incluso' : 'Add-on'}
      </span>
    </div>
  )
}

interface Props {
  entregaveis: any[]
}

export function ProposalEntregaveis({ entregaveis }: Props) {
  if (!entregaveis || entregaveis.length === 0) return null

  // Group all "Serviços" blocks into one, merging their cards
  const merged: any[] = []
  let servicosBlock: any | null = null
  for (const bloco of entregaveis) {
    if (bloco.label === 'Serviços' && bloco.cards) {
      if (!servicosBlock) {
        servicosBlock = { ...bloco, cards: [...bloco.cards] }
        merged.push(servicosBlock)
      } else {
        servicosBlock.cards.push(...bloco.cards)
      }
    } else {
      merged.push(bloco)
    }
  }

  return (
    <section className='py-14 md:py-20 proposal-content-px'>
      <p className='text-[11px] uppercase tracking-[4px] text-[#4CFF5C] font-bold mb-5'>
        O que está incluso
      </p>
      <h2 className='proposal-font-display text-3xl md:text-[42px] font-bold mb-10 leading-tight'>
        Entregáveis
      </h2>

      <div className='flex flex-col gap-16'>
        {merged.map((bloco: any, bIdx: number) => (
          <div key={bIdx}>
            <p className='text-[10px] uppercase tracking-[3px] text-[#4CFF5C] mb-2'>
              {bloco.label}
            </p>
            <h3 className='text-xl font-bold mb-6'>{bloco.titulo}</h3>

            {'itens' in bloco && bloco.itens && (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                {bloco.itens.map((item: any, idx: number) => {
                  const isEmoji = item.icone && /\p{Emoji}/u.test(item.icone);
                  const Icon = !isEmoji ? (iconMap[item.icone] || iconMap[item.titulo] || Video) : null;
                  return (
                    <div key={idx} className='relative overflow-hidden p-[18px] bg-[#111] rounded-2xl border border-gray-800 transition-all duration-300 hover:border-[#4CFF5C] hover:-translate-y-1 group flex gap-4'>
                      <div className='absolute top-0 left-0 right-0 h-[2px] bg-[#4CFF5C] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left' />
                      <div className='flex-1 min-w-0'>
                        <div className='w-10 h-10 rounded-[10px] bg-[#4CFF5C]/10 flex items-center justify-center mb-4'>
                          {isEmoji ? (
                            <span className='text-xl'>{item.icone}</span>
                          ) : (
                            Icon && <Icon className='w-5 h-5 text-[#4CFF5C]' />
                          )}
                        </div>
                        <h4 className='text-[15px] font-bold mb-1'>{item.titulo}</h4>
                        <p className='text-[13px] text-gray-400 leading-relaxed'>{item.descricao}</p>
                      </div>
                      {item.quantidade && (
                        <div className='border-l border-[#1f3d26] pl-4 min-w-[56px] flex items-center justify-center'>
                          <span className='proposal-font-display text-[42px] font-medium tracking-[-0.03em] text-[#4CFF5C] leading-none'>
                            {item.quantidade}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {'cards' in bloco && bloco.cards && (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
                {bloco.cards.map((card: any, cIdx: number) => {
                  const isEmoji = card.icone && /\p{Emoji}/u.test(card.icone);
                  const Icon = !isEmoji ? (iconMap[card.icone] || ClipboardList) : null;
                  return (
                    <div key={cIdx} className='relative overflow-hidden p-7 bg-[#111] rounded-2xl border border-gray-800 transition-all duration-300 hover:border-[#4CFF5C] hover:-translate-y-1 group'>
                      <div className='absolute top-0 left-0 right-0 h-[2px] bg-[#4CFF5C] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left' />
                      <div className='w-10 h-10 rounded-[10px] bg-[#4CFF5C]/10 flex items-center justify-center mb-4'>
                        {isEmoji ? (
                          <span className='text-xl'>{card.icone}</span>
                        ) : (
                          Icon && <Icon className='w-5 h-5 text-[#4CFF5C]' />
                        )}
                      </div>
                      <h4 className='text-[15px] font-bold mb-5'>{card.titulo}</h4>

                      {card.itens && (
                        <div className='flex flex-col'>
                          {card.itens.map((item: any, iIdx: number) => (
                            <CheckItem key={iIdx} nome={item.nome} ativo={item.ativo} quantidade={item.quantidade} />
                          ))}
                        </div>
                      )}

                      {card.subcategorias && card.subcategorias.map((sub: any, sIdx: number) => (
                        <div key={sIdx} className='mb-4 last:mb-0'>
                          <p className='text-[10px] uppercase tracking-[2px] text-gray-500 mb-2 mt-2'>
                            {sub.nome}
                          </p>
                          <div className='flex flex-col'>
                            {sub.itens.map((item: any, siIdx: number) => (
                              <CheckItem key={siIdx} nome={item.nome} ativo={item.ativo} quantidade={item.quantidade} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
