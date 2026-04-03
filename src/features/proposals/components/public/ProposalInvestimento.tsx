interface PaymentOption {
  titulo?: string
  valor?: string
  descricao?: string
  destaque?: string
  recomendado?: boolean
}

interface Props {
  baseValue: number
  finalValue: number
  discountPct: number
  listPrice: number | null
  paymentTerms: string
  paymentOptions: PaymentOption[]
  testimonialName: string | null
  testimonialRole: string | null
  testimonialText: string | null
  testimonialImage: string | null
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value)
}

export function ProposalInvestimento({
  baseValue, finalValue, discountPct, listPrice, paymentTerms,
  paymentOptions, testimonialName, testimonialRole, testimonialText, testimonialImage,
}: Props) {
  const valorTabela = listPrice ? formatCurrency(listPrice) : formatCurrency(baseValue)
  const valorFinal = formatCurrency(finalValue)
  const hasDiscount = discountPct > 0

  const defaultOptions: PaymentOption[] = paymentOptions.length > 0
    ? paymentOptions
    : [
        { titulo: 'Opção 1', valor: 'À Vista', descricao: 'Pagamento único com', destaque: '5% de desconto' },
        { titulo: 'Opção 2', valor: '2x', descricao: '50% na aprovação / 50% em 30 dias', recomendado: true },
      ]

  return (
    <div id='investimento' className='py-16 md:py-20'>
      <div className='proposal-content-px'>
        <p className='text-[11px] uppercase tracking-[4px] text-[#4CFF5C] font-bold mb-5'>
          Valores
        </p>
        <h2 className='proposal-font-display text-3xl md:text-[42px] font-bold mb-10 leading-tight'>
          Investimento
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Price card */}
          <div className='bg-[#111] rounded-2xl border border-gray-800 p-8 md:p-10 flex flex-col'>
            <div>
              <p className='text-xs uppercase tracking-[3px] text-gray-400 mb-3'>
                Valor Total do Projeto
              </p>
              {hasDiscount && (
                <div className='flex items-end gap-4'>
                  <p className='proposal-font-display text-2xl md:text-3xl font-bold text-gray-500 line-through opacity-50'>
                    {valorTabela}
                  </p>
                  <span className='text-[11px] uppercase tracking-[2px] text-[#4CFF5C] bg-[#4CFF5C]/10 px-3 py-1 rounded-full font-bold mb-1'>
                    -{discountPct}%
                  </span>
                </div>
              )}
            </div>

            <div className='flex-1 flex items-center md:-mt-8'>
              <p className='proposal-font-display text-5xl md:text-7xl font-bold text-[#4CFF5C]'>
                {valorFinal}
              </p>
            </div>

            <p className='text-sm text-gray-400'>*Valores sujeitos a alteração conforme escopo final do projeto</p>
          </div>

          {/* Conditions + Testimonial */}
          <div className='bg-[#111] rounded-2xl border border-gray-800 p-8 md:p-10 flex flex-col'>
            <div className='grid grid-cols-2 gap-4 mb-8'>
              {defaultOptions.map((cond, i) => (
                <div
                  key={i}
                  className={`relative p-5 bg-gray-900 rounded-xl text-center border transition-colors duration-300 hover:border-[#4CFF5C] ${
                    cond.recomendado ? 'border-[#4CFF5C]' : 'border-gray-800'
                  }`}
                >
                  {cond.recomendado && (
                    <span className='absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#4CFF5C] text-black text-[10px] font-bold px-3.5 py-0.5 rounded-full uppercase tracking-wider'>
                      Recomendado
                    </span>
                  )}
                  <p className='text-[12px] uppercase tracking-[2px] text-gray-400 mb-3'>{cond.titulo}</p>
                  <p className='proposal-font-display text-2xl font-bold text-[#f0f0f0] mb-1.5'>{cond.valor}</p>
                  <p className='text-[12px] text-gray-400'>
                    {cond.descricao}
                    {cond.destaque && (
                      <>
                        <br />
                        <strong className='text-[#4CFF5C]'>{cond.destaque}</strong>
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>

            <p className='text-xs text-gray-400 italic mb-8'>{paymentTerms}</p>

            {/* Testimonial */}
            {testimonialText && (
              <div className='flex items-center gap-5 pt-6 border-t border-gray-800 mt-auto'>
                <div className='w-14 h-14 rounded-full overflow-hidden flex-shrink-0'>
                  <img
                    src={testimonialImage || '/proposal-assets/Depoimento.png'}
                    alt={testimonialName || 'Depoimento'}
                    className='w-full h-full object-cover object-[center_5%] scale-150'
                  />
                </div>
                <div>
                  <p className='text-[13px] text-gray-300 leading-relaxed italic mb-1.5'>
                    "{testimonialText}"
                  </p>
                  <p className='text-[12px]'>
                    <span className='font-bold text-[#f0f0f0]'>{testimonialName}</span>
                    {testimonialRole && <span className='text-gray-500'> — {testimonialRole}</span>}
                  </p>
                </div>
              </div>
            )}

            {!testimonialText && (
              <div className='flex items-center gap-5 pt-6 border-t border-gray-800 mt-auto'>
                <div className='w-14 h-14 rounded-full overflow-hidden flex-shrink-0'>
                  <img src='/proposal-assets/Depoimento.png' alt='Depoimento' className='w-full h-full object-cover object-[center_5%] scale-150' />
                </div>
                <div>
                  <p className='text-[13px] text-gray-300 leading-relaxed italic mb-1.5'>
                    "O vídeo ficou excelente, de verdade! Eu amei o resultado e a qualidade do trabalho de vocês. Parabéns pela entrega!"
                  </p>
                  <p className='text-[12px]'>
                    <span className='font-bold text-[#f0f0f0]'>Thiago Nigro</span>
                    <span className='text-gray-500'> — CEO, Grupo Primo</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
