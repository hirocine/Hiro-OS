import { Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
  validityDate: string
}

export function ProposalNavbar({ validityDate }: Props) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const expDate = new Date(validityDate + 'T23:59:59')
    const calc = () => {
      const diff = expDate.getTime() - Date.now()
      if (diff <= 0) return
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }
    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [validityDate])

  return (
    <nav className='no-print fixed top-0 w-full proposal-content-px py-6 flex justify-between items-center z-50 bg-black/80 backdrop-blur-xl border-b border-[#4CFF5C]/10'>
      <a href='https://hiro.film/' target='_blank' rel='noopener noreferrer'>
        <img src="/proposal-assets/Asset10.svg" alt="Hiro Films" className='h-4' />
      </a>

      <div className='flex items-center gap-4'>
        <div className='hidden md:flex items-center gap-2.5'>
          <Clock className='text-[#4CFF5C]' size={13} strokeWidth={2} />
          <span className='text-[11px] uppercase tracking-[1.5px] text-gray-400'>
            Proposta válida por
          </span>
        </div>
        <div className='flex items-center divide-x divide-[#4CFF5C]/20 rounded-lg bg-[#4CFF5C]/10 text-[13px] tabular-nums text-[#f0f0f0]'>
          {timeLeft.days > 0 && (
            <span className='flex h-7 items-center justify-center px-2'>
              {timeLeft.days}
              <span className='text-gray-400 ml-0.5'>d</span>
            </span>
          )}
          <span className='flex h-7 items-center justify-center px-2'>
            {timeLeft.hours.toString().padStart(2, '0')}
            <span className='text-gray-400 ml-0.5'>h</span>
          </span>
          <span className='flex h-7 items-center justify-center px-2'>
            {timeLeft.minutes.toString().padStart(2, '0')}
            <span className='text-gray-400 ml-0.5'>m</span>
          </span>
          <span className='flex h-7 items-center justify-center px-2'>
            {timeLeft.seconds.toString().padStart(2, '0')}
            <span className='text-gray-400 ml-0.5'>s</span>
          </span>
        </div>
      </div>
    </nav>
  )
}
