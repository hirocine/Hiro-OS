import { MessageCircle, Download } from 'lucide-react';

interface Props {
  projectName: string;
  visible: boolean;
}

export function FloatingActions({ projectName, visible }: Props) {
  const whatsappUrl = `https://wa.me/5511951513862?text=${encodeURIComponent(`Olá! Gostaria de aprovar o orçamento do projeto ${projectName}.`)}`;

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-3 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-[#4CFF5C] hover:bg-[#4CFF5C]/90 text-black px-6 py-3 rounded-full shadow-lg transition-all duration-200 font-medium text-sm hover:scale-105"
      >
        <MessageCircle className="h-4 w-4" />
        Aprovar Orçamento
      </a>
      <button
        onClick={handleExportPDF}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 font-medium text-sm border border-white/10 hover:scale-105"
      >
        <Download className="h-4 w-4" />
        PDF
      </button>
    </div>
  );
}
