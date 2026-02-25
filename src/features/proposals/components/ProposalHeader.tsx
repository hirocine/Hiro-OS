import { useState } from 'react';
import hiroLogo from '@/assets/hiro-logo-full.svg';
import { InstagramIcon } from '@/components/icons/SocialIcons';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Sobre nós', href: 'https://hiro.film/about-us' },
  { label: 'Cases', href: 'https://hiro.film/cases' },
];

export function ProposalHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-[37px] left-0 right-0 z-40 print:hidden">
      <div className="bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex items-center justify-between h-16">
          {/* Logo */}
          <a href="https://hiro.film" target="_blank" rel="noopener noreferrer">
            <img src={hiroLogo} alt="Hiro Films" className="h-5 sm:h-6" />
          </a>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/60 hover:text-white transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://www.instagram.com/hirofilms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4CFF5C] hover:text-[#4CFF5C]/80 transition-colors duration-300"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href="https://wa.me/message/LUZWJIF3YEWND1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white border border-white/20 rounded-full px-5 py-1.5 hover:bg-white/10 transition-colors duration-300"
            >
              Contato
            </a>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex flex-col items-center justify-center gap-8 animate-in fade-in duration-200">
          <button
            className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="h-7 w-7" />
          </button>

          <a href="https://hiro.film" target="_blank" rel="noopener noreferrer">
            <img src={hiroLogo} alt="Hiro Films" className="h-8 mb-6" />
          </a>

          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl text-white/70 hover:text-white transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}

          <a
            href="https://www.instagram.com/hirofilms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#4CFF5C] hover:text-[#4CFF5C]/80 transition-colors"
          >
            <InstagramIcon className="h-6 w-6" />
          </a>

          <a
            href="https://wa.me/message/LUZWJIF3YEWND1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg text-white border border-white/20 rounded-full px-8 py-2 hover:bg-white/10 transition-colors duration-300"
          >
            Contato
          </a>
        </div>
      )}
    </header>
  );
}
