interface CaseItem {
  id?: string
  tipo?: string
  titulo?: string
  descricao?: string
  vimeoId?: string
  vimeoHash?: string
  destaque?: boolean
}

interface Props {
  cases: CaseItem[]
}

export function ProposalCases({ cases }: Props) {
  const filtered = cases
  if (filtered.length === 0) return null

  return (
    <section className='pt-6 pb-10 md:pt-8 md:pb-14 proposal-content-px'>
      <p className='text-[11px] uppercase tracking-[4px] text-[#4CFF5C] font-bold mb-5'>
        Portfólio
      </p>
      <h2 className='proposal-font-display text-3xl md:text-[42px] font-bold mb-5 leading-tight'>
        Cases Similares
      </h2>
      <p className='text-gray-400 max-w-[600px] mb-10'>
        Conheça alguns dos projetos que demonstram nossa capacidade de produção e direção criativa.
      </p>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {filtered.map((item, idx) => (
          <div
            key={item.id || idx}
            className='relative rounded-2xl overflow-hidden bg-gray-900 transition-all duration-400 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] group aspect-video'
          >
            {item.vimeoId && (
              <>
                <iframe
                  src={`https://player.vimeo.com/video/${item.vimeoId}?h=${item.vimeoHash || ''}&title=0&byline=0&portrait=0&background=1&muted=1`}
                  className='absolute inset-0 w-full h-full pointer-events-none proposal-video-iframe'
                  tabIndex={-1}
                  loading='lazy'
                />
                {/* Print fallback: static thumbnail */}
                <img
                  src={`https://vumbnail.com/${item.vimeoId}.jpg`}
                  alt={item.titulo || ''}
                  className='absolute inset-0 w-full h-full object-cover hidden proposal-video-thumb'
                />
              </>
            )}
            <div className='absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end p-6 md:p-8'>
              <h3 className='text-lg font-bold'>{item.titulo}</h3>
              <div className='flex items-center gap-3 mt-1'>
                <p className='text-[13px] text-gray-400'>{item.descricao}</p>
                {item.tipo && (
                  <span className='ml-auto text-[10px] uppercase tracking-[2px] text-white/80 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full whitespace-nowrap border border-white/10'>
                    {item.tipo}
                  </span>
                )}
              </div>
            </div>
            <div className='absolute inset-0 rounded-2xl border border-gray-800 pointer-events-none transition-colors duration-400 group-hover:border-[#4CFF5C] z-10' />
          </div>
        ))}
      </div>
    </section>
  )
}
