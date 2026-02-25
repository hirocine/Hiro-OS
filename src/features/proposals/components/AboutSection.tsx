const CLIENTS = ['Burger King', 'Kopenhagen', 'Porsche', 'SPFW', 'Grupo Primo', 'Pandora', 'Beyoung'];

export function AboutSection() {
  return (
    <section className="py-16 px-6 border-t border-white/5">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <h2 className="text-xs uppercase tracking-[0.3em] text-white/30 font-medium">Quem Somos</h2>
        <p className="text-lg sm:text-xl text-white/70 leading-relaxed font-light">
          A <span className="text-white font-semibold">HIRO</span> é um studio de produção audiovisual especializado em conteúdo criativo.
        </p>
      </div>

      {/* Infinite marquee */}
      <div className="mt-12 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#111113] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#111113] to-transparent z-10" />
        <div className="flex animate-marquee whitespace-nowrap">
          {[...CLIENTS, ...CLIENTS, ...CLIENTS].map((client, i) => (
            <span key={i} className="mx-8 text-lg sm:text-xl font-semibold text-white/20 uppercase tracking-widest shrink-0">
              {client}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
