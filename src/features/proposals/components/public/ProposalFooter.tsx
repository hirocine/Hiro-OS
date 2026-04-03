export function ProposalFooter() {
  return (
    <footer className='py-16 proposal-content-px'>
      <div className='flex justify-between items-start gap-10 flex-col md:flex-row'>
        <div className='text-left'>
          <p className='text-sm text-gray-300 font-bold'>
            Telefone: +55 11 91449-5151
          </p>
          <p className='text-sm text-gray-300 font-bold mt-4'>
            Email: contato@hiro.film
          </p>
          <p className='text-sm text-gray-300 font-bold mt-4 max-w-[400px]'>
            Av. Sagitário, 138 - Edifício City, Salas 2506 à 2513 - Alphaville Conde II, Barueri - SP, 06473-073
          </p>
        </div>
        <img src="/proposal-assets/Asset3.svg" alt="Hiro Films" className='h-[104px]' />
      </div>

      <div className='border-t border-gray-800 mt-12 pt-6 flex justify-between items-center flex-col md:flex-row gap-4'>
        <p className='text-xs text-gray-400'>
          Esta proposta é confidencial e destinada exclusivamente ao destinatário.
        </p>
        <div className='flex gap-4'>
          <a href='https://instagram.com/hirofilms' target='_blank' rel='noopener noreferrer' className='text-gray-400 hover:text-[#4CFF5C] transition-colors'>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </a>
          <a href='https://linkedin.com/company/hirofilms' target='_blank' rel='noopener noreferrer' className='text-gray-400 hover:text-[#4CFF5C] transition-colors'>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
              <rect x="2" y="9" width="4" height="12"/>
              <circle cx="4" cy="4" r="2"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
