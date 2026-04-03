import { Check, Lock } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  validityDate: string
}

const steps = [
  { num: 1, title: 'Briefing', status: 'done' as const },
  { num: 2, title: 'Proposta', status: 'current' as const },
  { num: 3, title: 'Kick-off', status: 'locked' as const },
  { num: 4, title: 'Gravação', status: 'locked' as const },
]

export function ProposalProximosPassos({ validityDate }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const dataLimite = (() => {
    try {
      return format(new Date(validityDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch {
      return validityDate
    }
  })()

  return (
    <section ref={sectionRef} id='proximos-passos' className='text-left py-28 md:py-56 proposal-content-px'>
      <div>
        <p className='text-[11px] uppercase tracking-[4px] text-[#4CFF5C] font-bold mb-5'>
          Vamos começar?
        </p>
        <h2 className='proposal-font-display text-3xl md:text-[42px] font-bold mb-5 leading-tight'>
          Próximos Passos
        </h2>
        <p className='text-gray-400 max-w-[500px]'>
          Para garantir as datas do seu projeto, precisamos da aprovação até <span className='text-[#f0f0f0] font-bold'>{dataLimite}</span>.
        </p>

        <style>{`
          @keyframes stepPulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.3); }
            100% { box-shadow: 0 0 0 14px rgba(255, 255, 255, 0); }
          }
          @keyframes lineGrow {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }
        `}</style>

        <div className='flex flex-col md:flex-row my-12 relative md:-ml-[45px]'>
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`flex flex-col md:items-center relative md:w-[140px] ${i < steps.length - 1 ? 'md:mr-[48px]' : ''}`}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.5s ease ${i * 0.15}s, transform 0.5s ease ${i * 0.15}s`,
              }}
            >
              {/* Desktop horizontal line */}
              {i < steps.length - 1 && (
                <div
                  className={`hidden md:block absolute top-[25px] left-[95px] h-px origin-left ${
                    step.status === 'done' ? 'bg-[#4CFF5C]/30' : 'bg-gray-600'
                  }`}
                  style={{
                    width: 'calc(140px + 48px - 50px)',
                    animation: visible ? `lineGrow 0.4s ease ${i * 0.15 + 0.3}s both` : 'none',
                  }}
                />
              )}
              {/* Mobile: circle + title side by side, centered */}
              <div className='flex flex-row items-center gap-4 md:flex-col md:gap-0'>
                <div
                  className={`w-[50px] h-[50px] min-w-[50px] rounded-full flex items-center justify-center font-bold text-lg md:mb-4 relative z-10 border-2 ${
                    step.status === 'done'
                      ? 'bg-[#4CFF5C]/10 border-[#4CFF5C] text-[#4CFF5C]'
                      : step.status === 'current'
                      ? 'bg-white/10 border-[#f0f0f0] text-[#f0f0f0]'
                      : 'bg-transparent border-gray-700 text-gray-500'
                  }`}
                  style={step.status === 'current' ? { animation: 'stepPulse 1.5s ease-out infinite' } : {}}
                >
                  {step.status === 'done' ? (
                    <Check className='w-5 h-5' />
                  ) : step.status === 'locked' ? (
                    <Lock className='w-4 h-4' />
                  ) : (
                    step.num
                  )}
                </div>
                <h4 className={`text-sm font-bold ${
                  step.status === 'done' ? 'text-[#4CFF5C]' : step.status === 'current' ? 'text-[#f0f0f0]' : 'text-gray-500'
                }`}>{step.title}</h4>
              </div>
              {/* Mobile vertical line BETWEEN steps */}
              {i < steps.length - 1 && (
                <div
                  className={`block md:hidden w-px h-[24px] ml-[25px] ${
                    step.status === 'done' ? 'bg-[#4CFF5C]/30' : 'bg-[#374151]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
