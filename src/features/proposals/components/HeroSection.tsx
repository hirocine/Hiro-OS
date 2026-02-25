interface Props {
  projectName: string;
  clientName: string;
}

export function HeroSection({ projectName, clientName }: Props) {
  return (
    <section className="relative pt-20 pb-16 sm:pt-28 sm:pb-24 px-6 text-center overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative max-w-4xl mx-auto space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-white/40 font-medium">Proposta Comercial</p>
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
          {projectName}
        </h1>
        <p className="text-lg sm:text-xl text-white/50 font-light">
          para <span className="text-white/80 font-medium">{clientName}</span>
        </p>
      </div>
    </section>
  );
}
