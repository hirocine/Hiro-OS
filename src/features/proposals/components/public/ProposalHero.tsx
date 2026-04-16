import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  clientName: string
  projectName: string
  validityDate: string
  createdAt: string
  clientResponsible: string | null
  companyDescription: string | null
}

export function ProposalHero({ clientName, projectName, validityDate, createdAt, clientResponsible, companyDescription }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const maskRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const mask = maskRef.current
    if (!section || !mask) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const gradient = `radial-gradient(circle 250px at ${x}px ${y}px, rgba(0,0,0,0.5) 0%, transparent 100%)`
      mask.style.maskImage = gradient
      mask.style.webkitMaskImage = gradient
    }

    const handleMouseLeave = () => {
      mask.style.maskImage = 'radial-gradient(circle 0px at 0px 0px, transparent 0%, transparent 100%)'
      mask.style.webkitMaskImage = 'radial-gradient(circle 0px at 0px 0px, transparent 0%, transparent 100%)'
    }

    section.addEventListener('mousemove', handleMouseMove)
    section.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      section.removeEventListener('mousemove', handleMouseMove)
      section.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  const formattedDate = (() => {
    try {
      return format(new Date(createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch {
      return createdAt
    }
  })()

  const validityDays = (() => {
    try {
      const diff = new Date(validityDate).getTime() - new Date(createdAt).getTime()
      return `${Math.ceil(diff / (1000 * 60 * 60 * 24))} dias`
    } catch {
      return '15 dias'
    }
  })()

  const fadeUp = (delay: number): React.CSSProperties => ({
    opacity: 0,
    animation: `proposal-fade-up 0.8s ease-out ${delay}ms forwards`,
  })

  const fadeIn = (delay: number, finalOpacity: number = 1): React.CSSProperties => ({
    opacity: 0,
    animation: `proposal-fade-in 1s ease-out ${delay}ms forwards`,
    ...(finalOpacity < 1 && { '--fade-final-opacity': finalOpacity } as React.CSSProperties),
  })

  return (
    <section ref={sectionRef} className='relative min-h-[92vh] flex flex-col justify-center items-start text-left proposal-content-px pt-40 pb-20'>
      {/* Background image */}
      <div style={fadeIn(200)} className='absolute inset-0 pointer-events-none overflow-hidden'>
        <img src='/proposal-assets/bg.png' alt='' className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[95%] max-w-[95%] object-contain opacity-10' />
        <div ref={maskRef} className='absolute inset-0' style={{ maskImage: 'radial-gradient(circle 0px at 0px 0px, transparent 0%, transparent 100%)', WebkitMaskImage: 'radial-gradient(circle 0px at 0px 0px, transparent 0%, transparent 100%)' }}>
          <img src='/proposal-assets/bg.png' alt='' className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[95%] max-w-[95%] object-contain opacity-50' />
        </div>
        <div className='absolute inset-0 bg-gradient-to-r from-black/80 to-transparent' />
      </div>
      {/* Animated gradient */}
      <div style={fadeIn(400)} className='absolute inset-0 pointer-events-none overflow-hidden'>
        <div className='absolute inset-[-10%] w-[120%] h-[120%] proposal-gradient-1' />
        <div className='absolute inset-[-10%] w-[120%] h-[120%] proposal-gradient-2' />
      </div>

      <p style={fadeUp(0)} className='text-[11px] uppercase tracking-[6px] text-[#4CFF5C] font-medium mb-8 relative z-10'>
        Proposta Comercial {new Date(createdAt).getFullYear()}
      </p>

      <h1 style={fadeUp(150)} className='proposal-font-display text-5xl md:text-7xl font-bold mb-5 leading-[1.1] relative z-10 uppercase'>
        {projectName}
      </h1>

      <p style={fadeUp(300)} className='text-base md:text-lg text-gray-400 font-light mb-16 max-w-[750px] relative z-10'>
        {companyDescription || 'Produtora audiovisual especializada em criar narrativas visuais que conectam marcas ao seu público.'}
      </p>

      <div style={fadeUp(450)} className='w-[60px] h-[2px] bg-[#4CFF5C] mb-10 relative z-10' />

      <div style={fadeUp(600)} className='flex gap-8 md:gap-12 flex-wrap relative z-10 w-full items-center'>
        <InfoItem label='Cliente' value={clientName} />
        <div className='hidden md:block w-px h-10 bg-gray-700 self-center' />
        {clientResponsible && (
          <>
            <InfoItem label='Responsável' value={clientResponsible} />
            <div className='hidden md:block w-px h-10 bg-gray-700 self-center' />
          </>
        )}
        <InfoItem label='Data de Envio' value={formattedDate} />
        <div className='hidden md:block w-px h-10 bg-gray-700 self-center' />
        <InfoItem label='Validade' value={validityDays} />

        <div className='hidden md:flex flex-col items-center gap-1.5 ml-auto proposal-bounce-slow no-print'>
          <span className='text-[10px] uppercase tracking-[3px] text-gray-500'>Scroll</span>
          <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='text-gray-500'>
            <path d='M7 13l5 5 5-5M7 6l5 5 5-5' />
          </svg>
        </div>
      </div>
    </section>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className='text-left'>
      <p className='text-[10px] uppercase tracking-[3px] text-gray-400 mb-2'>{label}</p>
      <p className='text-base font-medium text-[#f0f0f0]'>{value}</p>
    </div>
  )
}
