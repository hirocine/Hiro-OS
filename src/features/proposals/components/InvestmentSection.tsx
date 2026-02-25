interface Props {
  baseValue: number;
  discountPct: number;
  finalValue: number;
  paymentTerms: string;
}

export function InvestmentSection({ baseValue, discountPct, finalValue, paymentTerms }: Props) {
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const hasDiscount = discountPct > 0;

  return (
    <section className="py-20 border-t border-white/10">
      <div className="text-center space-y-8">
        <h2 className="text-xs uppercase tracking-[0.3em] text-[#4CFF5C] font-medium">Investimento</h2>

        <div className="space-y-3">
          {hasDiscount && (
            <div className="space-y-2">
              <p className="text-lg text-white/30 line-through">{fmt(baseValue)}</p>
              <span className="inline-block bg-[#4CFF5C]/20 text-[#4CFF5C] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {discountPct}% OFF
              </span>
            </div>
          )}

          <p className="text-5xl sm:text-6xl font-bold tracking-tight text-white">
            {fmt(finalValue)}
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <p className="text-white/40 text-sm leading-relaxed">
            {paymentTerms}
          </p>
        </div>
      </div>
    </section>
  );
}
