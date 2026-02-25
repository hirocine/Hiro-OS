import hiroLogo from '@/assets/hiro-logo-full.svg';
import { InstagramIcon } from '@/components/icons/SocialIcons';

export function ProposalHeader() {
  return (
    <header className="fixed top-[37px] left-0 right-0 z-40 print:hidden">
      <div className="bg-[#111113]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex items-center justify-between h-16">
          {/* Logo */}
          <a href="https://hirofilms.com.br" target="_blank" rel="noopener noreferrer">
            <img src={hiroLogo} alt="Hiro Films" className="h-5 sm:h-6 brightness-0 invert" />
          </a>

          {/* Nav links */}
          <nav className="flex items-center gap-6 sm:gap-8">
            <a
              href="https://hirofilms.com.br/#about"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block text-sm text-white/60 hover:text-white transition-colors"
            >
              Sobre nós
            </a>
            <a
              href="https://hirofilms.com.br/#cases"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block text-sm text-white/60 hover:text-white transition-colors"
            >
              Cases
            </a>
            <a
              href="https://www.instagram.com/hirofilms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href="https://wa.me/5511951513862"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white border border-white/20 rounded-full px-5 py-1.5 hover:bg-white/10 transition-colors"
            >
              Contato
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
