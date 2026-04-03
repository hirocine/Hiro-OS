import { Star, Clock, Layers } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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

const defaultDores: (DorItem & { icon: LucideIcon })[] = [
  {
    label: 'Prioridade',
    title: 'Qualidade visual premium',
    desc: 'O padrão estético do conteúdo precisa refletir o posicionamento da marca. Não há espaço para entregas medianas.',
    icon: Star,
  },
  {
    label: 'Desafio',
    title: 'Prazo e previsibilidade',
    desc: 'O projeto tem uma data de veiculação definida. Cada etapa precisa ser cumprida sem comprometer o resultado final.',
    icon: Clock,
  },
  {
    label: 'Contexto',
    title: 'Conteúdo multiplataforma',
    desc: 'O material precisa funcionar em diferentes formatos e canais, mantendo coesão visual e narrativa em todos eles.',
    icon: Layers,
  },
]

const iconForIndex = [Star, Clock, Layers]

export function ProposalObjetivo({ objetivo, clientName, diagnosticoDores }: Props) {
  if (!objetivo && diagnosticoDores.length === 0) return null

  const dores = diagnosticoDores.length > 0
    ? diagnosticoDores.map((d, i) => ({ ...d, icon: iconForIndex[i % iconForIndex.length] }))
    : defaultDores

  const textoObjetivo = objetivo
    ? objetivo.replaceAll('{empresa}', clientName)
    : `O objetivo deste projeto é desenvolver conteúdo audiovisual para ${clientName}, com foco em fortalecer o posicionamento da marca no digital.`

  return (
    <section className='py-14 md:py-20 proposal-content-px'>
      <p className='text-[11px] uppercase tracking-[4px] text-[#4CFF5C] font-bold mb-5'>
        Sobre o Projeto
      </p>
      <h2 className='proposal-font-display text-3xl md:text-[42px] font-bold mb-5 leading-tight'>
        Diagnóstico
      </h2>
      <p className='text-gray-400 max-w-[700px] mb-12 whitespace-pre-line'>
        {textoObjetivo}
      </p>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
        {dores.map((h, i) => (
          <div key={i} className='bg-[#111] rounded-2xl border border-gray-800 p-7 transition-all duration-300 hover:border-[#4CFF5C] hover:-translate-y-1'>
            <div className='w-10 h-10 rounded-[10px] bg-[#4CFF5C]/10 flex items-center justify-center mb-5'>
              <h.icon className='w-5 h-5 text-[#4CFF5C]' />
            </div>
            <h4 className='text-[15px] font-bold mb-2'>{h.title}</h4>
            <p className='text-[13px] text-gray-400 leading-relaxed'>{h.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
