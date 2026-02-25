import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import hiroLogo from '@/assets/hiro-logo.png';
import { Separator } from '@/components/ui/separator';

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

  const metadataItems = [
    { label: 'Responsável', value: clientResponsible || '—' },
    { label: 'Data', value: formatDate(createdAt) },
    { label: 'Validade', value: formatDate(validityDate) },
  ];

  return (
    <section className="relative min-h-screen flex flex-col justify-between bg-[#0A0A0A] overflow-hidden px-6 sm:px-10 lg:px-16 pt-24 sm:pt-28 pb-8 sm:pb-12">
      {/* Green radial glow — bottom right */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 90% 85%, rgba(76,255,92,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
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
        {/* Metadata row — label / separator / value */}
        <div className="space-y-3">
          {metadataItems.map((item, i) => (
            <div key={i} className="flex items-center gap-4 text-sm">
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#4CFF5C] font-medium shrink-0 w-24 sm:w-28">
                {item.label}
              </span>
              <Separator className="flex-1 bg-white/10" />
              <span className="text-white font-medium shrink-0">{item.value}</span>
            </div>
          ))}
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
