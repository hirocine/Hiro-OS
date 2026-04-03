interface DorItem {
  label?: string
  title?: string
  desc?: string
}

interface Props {
  objetivo: string | null
  clientName: string
  diagnosticoDores: DorItem[]
}

const defaultDores: DorItem[] = [
  {
    label: '⭐',
    title: 'Qualidade visual premium',
    desc: 'O padrão estético do conteúdo precisa refletir o posicionamento da marca. Não há espaço para entregas medianas.',
  },
  {
    label: '⏰',
    title: 'Prazo e previsibilidade',
    desc: 'O projeto tem uma data de veiculação definida. Cada etapa precisa ser cumprida sem comprometer o resultado final.',
  },
  {
    label: '🎬',
    title: 'Conteúdo multiplataforma',
    desc: 'O material precisa funcionar em diferentes formatos e canais, mantendo coesão visual e narrativa em todos eles.',
  },
]

export function ProposalObjetivo({ objetivo, clientName, diagnosticoDores }: Props) {
  if (!objetivo && diagnosticoDores.length === 0) return null

  const dores = diagnosticoDores.length > 0 ? diagnosticoDores : defaultDores

  const textoObjetivo = objetivo
    ? objetivo.split('{empresa}').join(clientName)
    : `O objetivo deste projeto é desenvolver conteúdo audiovisual para ${clientName}, com foco em fortalecer o posicionamento da marca no digital.`

  return (
    <section className='py-14 md:py-20 proposal-content-px'>
      <p className='text-[11px] uppercase tracking-[4px] text-[#4CFF5C] font-bold mb-5'>
        Sobre o Projeto
      </p>
      <h2 className='proposal-font-display text-3xl md:text-[42px] font-bold mb-5 leading-tight'>
        Diagnóstico
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16'>
        <div>
          <p className='text-gray-400 whitespace-pre-line leading-relaxed'>
            {textoObjetivo}
          </p>
        </div>

        <div className='flex flex-col gap-4'>
          {dores.map((h, i) => (
            <div key={i} className='bg-[#111] rounded-2xl border border-gray-800 p-6 transition-all duration-300 hover:border-[#4CFF5C]'>
              <div className='flex items-start gap-4'>
                <div className='w-10 h-10 rounded-[10px] bg-[#4CFF5C]/10 flex items-center justify-center flex-shrink-0 text-xl'>
                  {h.label || '⭐'}
                </div>
                <div>
                  <h4 className='text-[15px] font-bold mb-1'>{h.title}</h4>
                  <p className='text-[13px] text-gray-400 leading-relaxed'>{h.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
