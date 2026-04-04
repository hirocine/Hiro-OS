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
              <iframe
                src={`https://player.vimeo.com/video/${item.vimeoId}?h=${item.vimeoHash || ''}&title=0&byline=0&portrait=0&background=1&muted=1`}
                className='absolute inset-0 w-full h-full pointer-events-none'
                tabIndex={-1}
                loading='lazy'
              />
            )}
            <div className='absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end p-6 md:p-8'>
              <p className='text-[10px] uppercase tracking-[3px] text-[#4CFF5C] mb-2'>
                {item.tipo}
              </p>
              <h3 className='text-lg font-bold'>{item.titulo}</h3>
              <p className='text-[13px] text-gray-400 mt-1'>{item.descricao}</p>
            </div>
            <div className='absolute inset-0 rounded-2xl border border-gray-800 pointer-events-none transition-colors duration-400 group-hover:border-[#4CFF5C] z-10' />
          </div>
        ))}
      </div>
    </section>
  )
}
