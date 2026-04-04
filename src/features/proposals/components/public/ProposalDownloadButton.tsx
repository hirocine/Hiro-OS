import { Download, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
  whatsappNumber: string | null
  projectName: string
}

export function ProposalDownloadButton({ whatsappNumber, projectName }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const investimento = document.getElementById('investimento')
    const passos = document.getElementById('proximos-passos')
    if (!investimento && !passos) return

    const observer = new IntersectionObserver(
      (entries) => setVisible(entries.some((e) => e.isIntersecting)),
      { threshold: 0.1 }
    )
    if (investimento) observer.observe(investimento)
    if (passos) observer.observe(passos)
    return () => observer.disconnect()
  }, [])

  const phone = (whatsappNumber || '5511951513862').replace(/\D/g, '')
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(`Olá! Gostaria de aprovar a proposta do projeto ${projectName}.`)}`

  return (
    <div
      className={`no-print fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-3 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <a
        href={whatsappUrl}
        target='_blank'
        rel='noopener noreferrer'
        className='inline-flex items-center gap-2.5 bg-[#4CFF5C] text-black px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-[2px] hover:bg-[#5fff6b] hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(76,255,92,0.3)] transition-all duration-300 shadow-[0_4px_20px_rgba(76,255,92,0.3)]'
      >
        <MessageCircle className='w-4 h-4' />
        Aprovar via WhatsApp
      </a>
      <button
        onClick={() => window.print()}
        className='group relative overflow-hidden bg-white/10 backdrop-blur-sm text-[#f0f0f0] hover:bg-white/20 border border-gray-700 hover:border-[#4CFF5C] shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 uppercase tracking-wider text-xs font-bold rounded-xl px-8 py-3.5 h-auto inline-flex items-center'
      >
        <Download size={14} strokeWidth={2} className='mr-2' />
        Baixar PDF
      </button>
    </div>
  )
}
