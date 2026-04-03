import { InfiniteSlider } from './InfiniteSlider'

const clientLogos = Array.from({ length: 13 }, (_, i) => ({
  id: `c${i + 1}`,
  logo: `/logos/Logo ${i + 1}.png`,
}))

export function ProposalClients() {
  return (
    <section className='py-14 md:py-20'>
      <div className='proposal-content-px'>
        <p className='text-[11px] uppercase tracking-[4px] text-[#4CFF5C] font-bold mb-5'>
          Quem confia na Hiro Films
        </p>
        <h2 className='proposal-font-display text-3xl md:text-[42px] font-bold mb-10 leading-tight'>
          Nossos Clientes
        </h2>
      </div>

      <InfiniteSlider gap={40} duration={30} className='py-4'>
        {[...clientLogos, ...clientLogos].map((cliente, i) => (
          <div key={`${cliente.id}-${i}`} className='flex-shrink-0 h-8 w-auto opacity-40 hover:opacity-80 transition-opacity duration-300'>
            <img src={cliente.logo} alt={cliente.id} className='h-full w-auto object-contain invert' />
          </div>
        ))}
      </InfiniteSlider>
    </section>
  )
}
