import { InfiniteSlider } from './InfiniteSlider'

const clientLogos = Array.from({ length: 13 }, (_, i) => ({
  id: `c${i + 1}`,
  logo: `/logos/Logo ${i + 1}.png`,
}))

export function ProposalClients() {
  return (
    <div className='bg-black py-16 md:py-20 rounded-t-[40px] border-t border-gray-800'>
      <div className='proposal-content-px'>
        <p className='text-[11px] uppercase tracking-[4px] text-[#4CFF5C] font-bold mb-5'>
          Quem confia na Hiro Films
        </p>
        <h2 className='proposal-font-display text-3xl md:text-[42px] font-bold mb-10 leading-tight'>
          Nossos Clientes
        </h2>
      </div>

      <div className='relative h-[100px] w-full overflow-hidden mb-14'>
        <InfiniteSlider
          className='flex h-full w-full items-center'
          duration={60}
          gap={64}
        >
          {[...clientLogos, ...clientLogos].map((cliente, i) => (
            <div
              key={`${cliente.id}-${i}`}
              className='flex-shrink-0 w-[150px] h-[70px] flex items-center justify-center'
            >
              <img
                src={cliente.logo}
                alt={cliente.id}
                className='max-h-[55px] max-w-[130px] object-contain opacity-60 hover:opacity-100 transition-opacity duration-300'
              />
            </div>
          ))}
        </InfiniteSlider>
        <div className='pointer-events-none absolute inset-0 left-0 w-[600px] bg-gradient-to-r from-black to-transparent' />
        <div className='pointer-events-none absolute inset-0 left-auto w-[600px] bg-gradient-to-l from-black to-transparent' />
      </div>
    </div>
  )
}
