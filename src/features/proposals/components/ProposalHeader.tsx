import { forwardRef } from 'react';
import hiroLogo from '@/assets/hiro-logo-full.svg';
import { MessageCircle, Download } from 'lucide-react';

interface Props {
  projectName: string;
}

export const ProposalHeader = forwardRef<HTMLElement, Props>(({ projectName }, ref) => {
  const whatsappUrl = `https://wa.me/5511951513862?text=${encodeURIComponent(`Olá! Gostaria de aprovar o orçamento do projeto ${projectName}.`)}`;

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <header ref={ref} className="print:hidden">
      <div className="bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex items-center justify-between h-16 sm:h-18">
          <a href="https://hiro.film" target="_blank" rel="noopener noreferrer">
            <img src={hiroLogo} alt="Hiro Films" className="h-3 sm:h-4" />
          </a>

          <div className="flex items-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#4CFF5C] hover:bg-[#4CFF5C]/90 text-black px-5 py-2 rounded-full shadow-lg transition-all duration-200 font-medium text-sm hover:scale-105"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Aprovar Orçamento</span>
              <span className="sm:hidden">Aprovar</span>
            </a>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 font-medium text-sm border border-white/10 hover:scale-105"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});

ProposalHeader.displayName = 'ProposalHeader';
