import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import hiroLogo from '@/assets/hiro-logo.png';

interface Props {
  projectName: string;
  clientName: string;
  projectNumber?: string | null;
  validityDate?: string;
  createdAt?: string;
  clientResponsible?: string | null;
}

export function HeroSection({ projectName, clientName, projectNumber, validityDate, createdAt, clientResponsible }: Props) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '—';
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-between bg-[#111113] overflow-hidden px-6 sm:px-10 lg:px-16 py-8 sm:py-12">
      {/* Green radial glow — bottom right */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 90% 85%, rgba(34,197,94,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center justify-between text-[10px] sm:text-xs uppercase tracking-[0.25em] text-white/40 font-medium">
        <span>Nº {projectNumber || '—'}</span>
        <span className="font-bold tracking-[0.35em] text-white/60">HIRO FILMS®</span>
        <span>Proposta de Investimento</span>
      </div>

      {/* ── Client name — center ── */}
      <div className="relative z-10 flex-1 flex items-center">
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-black uppercase tracking-tighter leading-[0.9] text-white max-w-full break-words">
          {clientName}
        </h1>
      </div>

      {/* ── Bottom section ── */}
      <div className="relative z-10 flex flex-col gap-6 sm:gap-8">
        {/* Metadata row */}
        <div className="flex flex-wrap gap-x-10 gap-y-3 text-sm">
          <div>
            <span className="block text-[10px] sm:text-xs uppercase tracking-[0.2em] text-green-400 mb-1">Responsável</span>
            <span className="text-white font-medium">{clientResponsible || '—'}</span>
          </div>
          <div>
            <span className="block text-[10px] sm:text-xs uppercase tracking-[0.2em] text-green-400 mb-1">Data</span>
            <span className="text-white font-medium">{formatDate(createdAt)}</span>
          </div>
          <div>
            <span className="block text-[10px] sm:text-xs uppercase tracking-[0.2em] text-green-400 mb-1">Validade</span>
            <span className="text-white font-medium">{formatDate(validityDate)}</span>
          </div>
        </div>

        {/* Decorative footer */}
        <div className="flex items-end justify-between">
          <span className="text-white/20 text-lg tracking-[0.5em] select-none">+ +</span>
          <img src={hiroLogo} alt="Hiro Films" className="h-6 sm:h-8 opacity-60" />
        </div>
      </div>
    </section>
  );
}
