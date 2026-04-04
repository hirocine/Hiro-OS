import { forwardRef } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, Lock, Video, Smartphone, Camera, ClipboardList, Clapperboard, Palette, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Proposal } from '../../types'

const iconMap: Record<string, LucideIcon> = {
  'Vídeo principal': Video,
  'Cortes para redes sociais': Smartphone,
  'Fotos de bastidores': Camera,
  'ClipboardList': ClipboardList,
  'Clapperboard': Clapperboard,
  'Palette': Palette,
}


const PAGE_WIDTH = 794
const PAGE_MIN_HEIGHT = 1123

interface Props {
  proposal: Proposal
  caseThumbnails: Record<string, string>
  footerPngDataUri?: string
}

/* ------------------------------------------------------------------ */
/*  PDF-safe helpers – position:absolute centering, NO flexbox        */
/* ------------------------------------------------------------------ */

function PdfCenteredEmoji({ emoji, size = 40, fontSize = 20 }: { emoji: string; size?: number; fontSize?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: 'rgba(76,255,92,0.1)', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
      <span style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, lineHeight: `${size}px`, textAlign: 'center', fontSize, display: 'block' }}>{emoji}</span>
    </div>
  )
}

function PdfCenteredIcon({ Icon, size, iconSize, borderRadius, background, color, border }: {
  Icon: LucideIcon; size: number; iconSize: number; borderRadius: number | string;
  background: string; color: string; border?: string;
}) {
  const offset = Math.round((size - iconSize) / 2)
  return (
    <div style={{ width: size, height: size, borderRadius, background, border, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
      <Icon style={{ position: 'absolute', top: offset, left: offset, width: iconSize, height: iconSize, color, display: 'block' }} />
    </div>
  )
}

function PdfBadge({ children, bg, color, fontSize = 8, letterSpacing = 1.5, padding = '3px 8px', border }: {
  children: React.ReactNode; bg: string; color: string;
  fontSize?: number; letterSpacing?: number; padding?: string; border?: string;
}) {
  const h = fontSize + 10
  const hPad = typeof padding === 'string' ? padding.split(' ').pop() : '8px'
  return (
    <span style={{
      display: 'inline-block', height: h, lineHeight: `${h}px`,
      textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap',
      fontSize, letterSpacing, textTransform: 'uppercase', fontWeight: 700,
      padding: `0 ${hPad}`, borderRadius: 999, background: bg, color, border,
    }}>{children}</span>
  )
}

function PdfCenteredText({ text, size, fontSize, color, fontWeight = 700 }: {
  text: string; size: number; fontSize: number; color: string; fontWeight?: number;
}) {
  return (
    <span style={{ display: 'block', width: size, height: size, lineHeight: `${size}px`, textAlign: 'center', fontSize, fontWeight, color }}>{text}</span>
  )
}

/* ------------------------------------------------------------------ */
/*  Reusable building blocks                                          */
/* ------------------------------------------------------------------ */

function PdfInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className='text-left'>
      <p style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#999', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 500, color: '#f0f0f0' }}>{value}</p>
    </div>
  )
}

function PdfCheckItem({ nome, ativo, quantidade }: { nome: string; ativo: boolean; quantidade?: string }) {
  const boxSize = 22
  const icoSize = 14
  const icoOff = Math.round((boxSize - icoSize) / 2)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', color: ativo ? '#f0f0f0' : '#555' }}>
      <div style={{ width: boxSize, height: boxSize, borderRadius: 5, flexShrink: 0, overflow: 'hidden', position: 'relative', background: ativo ? 'rgba(76,255,92,0.15)' : '#1a1a1a' }}>
        {!ativo
          ? <X style={{ position: 'absolute', top: icoOff, left: icoOff, width: icoSize, height: icoSize, color: '#555', display: 'block' }} />
          : quantidade
            ? <PdfCenteredText text={quantidade} size={boxSize} fontSize={8} color='#4CFF5C' />
            : <Check style={{ position: 'absolute', top: icoOff, left: icoOff, width: icoSize, height: icoSize, color: '#4CFF5C', display: 'block' }} />
        }
      </div>
      <span style={{ fontSize: 11, flex: 1 }}>{nome}</span>
      <PdfBadge bg={ativo ? 'rgba(76,255,92,0.1)' : 'rgba(30,30,30,0.5)'} color={ativo ? 'rgba(76,255,92,0.6)' : '#555'}>
        {ativo ? 'Incluso' : 'Add-on'}
      </PdfBadge>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sections                                                          */
/* ------------------------------------------------------------------ */

function PdfHero({ proposal }: { proposal: Proposal }) {
  const formattedDate = (() => {
    try { return format(new Date(proposal.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) } catch { return proposal.created_at }
  })()
  const validityDays = (() => {
    try {
      const diff = new Date(proposal.validity_date).getTime() - new Date(proposal.created_at).getTime()
      return `${Math.ceil(diff / (1000 * 60 * 60 * 24))} dias`
    } catch { return '15 dias' }
  })()

  return (
    <div style={{ padding: '60px 60px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <img src='/proposal-assets/bg.png' alt='' style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', maxHeight: '90%', maxWidth: '90%', objectFit: 'contain', opacity: 0.08 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10,10,10,0.9) 40%, transparent)' }} />
      </div>

      <p style={{ fontSize: 10, letterSpacing: 6, textTransform: 'uppercase', color: '#4CFF5C', fontWeight: 500, marginBottom: 32, position: 'relative', zIndex: 1 }}>
        Proposta Comercial {new Date(proposal.created_at).getFullYear()}
      </p>
      <h1 style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.1, marginBottom: 20, textTransform: 'uppercase', position: 'relative', zIndex: 1, fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
        {proposal.project_name}
      </h1>
      <p style={{ fontSize: 15, color: '#999', fontWeight: 300, marginBottom: 48, maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {proposal.company_description || 'Produtora audiovisual especializada em criar narrativas visuais que conectam marcas ao seu público.'}
      </p>
      <div style={{ width: 50, height: 2, background: '#4CFF5C', marginBottom: 36, position: 'relative', zIndex: 1 }} />
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', position: 'relative', zIndex: 1, alignItems: 'center' }}>
        <PdfInfoItem label='Cliente' value={proposal.client_name} />
        <div style={{ width: 1, height: 36, background: '#333' }} />
        {proposal.client_responsible && (
          <>
            <PdfInfoItem label='Responsável' value={proposal.client_responsible} />
            <div style={{ width: 1, height: 36, background: '#333' }} />
          </>
        )}
        <PdfInfoItem label='Data de Envio' value={formattedDate} />
        <div style={{ width: 1, height: 36, background: '#333' }} />
        <PdfInfoItem label='Validade' value={validityDays} />
      </div>
    </div>
  )
}

function PdfClients() {
  const logos = Array.from({ length: 13 }, (_, i) => `/logos/Logo ${i + 1}.png`)
  return (
    <div style={{ padding: '30px 60px 40px', position: 'relative', zIndex: 2 }}>
      <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#4CFF5C', fontWeight: 700, marginBottom: 10 }}>
        Quem confia na Hiro Films
      </p>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif', color: '#ffffff' }}>
        Nossos Clientes
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20, alignItems: 'center', justifyItems: 'center' }}>
        {logos.map((logo, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 50 }}>
            <img src={logo} alt='' style={{ maxHeight: 42, maxWidth: 105, objectFit: 'contain', opacity: 0.85 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function PdfDiagnostico({ proposal }: { proposal: Proposal }) {
  const defaultDores = [
    { label: '⭐', title: 'Qualidade visual premium', desc: 'O padrão estético do conteúdo precisa refletir o posicionamento da marca.' },
    { label: '⏰', title: 'Prazo e previsibilidade', desc: 'O projeto tem uma data de veiculação definida.' },
    { label: '🎬', title: 'Conteúdo multiplataforma', desc: 'O material precisa funcionar em diferentes formatos e canais.' },
  ]
  const dores = proposal.diagnostico_dores.length > 0 ? proposal.diagnostico_dores : defaultDores
  const texto = proposal.objetivo
    ? proposal.objetivo.split('{empresa}').join(proposal.client_name)
    : `O objetivo deste projeto é desenvolver conteúdo audiovisual para ${proposal.client_name}, com foco em fortalecer o posicionamento da marca no digital.`

  return (
    <div style={{ padding: '50px 60px' }}>
      <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#4CFF5C', fontWeight: 700, marginBottom: 16 }}>
        Sobre o Projeto
      </p>
      <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 20, fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
        Diagnóstico
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        <p style={{ color: '#999', whiteSpace: 'pre-line', lineHeight: 1.7, fontSize: 13 }}>{texto}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dores.map((d, i) => (
            <div key={i} style={{ background: '#111', borderRadius: 14, border: '1px solid #222', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <PdfCenteredEmoji emoji={d.label || '⭐'} size={36} fontSize={18} />
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{d.title}</h4>
                  <p style={{ fontSize: 11, color: '#999', lineHeight: 1.5 }}>{d.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PdfCases({ cases, thumbnails }: { cases: Proposal['cases']; thumbnails: Record<string, string> }) {
  if (cases.length === 0) return null
  return (
    <div style={{ padding: '50px 60px' }}>
      <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#4CFF5C', fontWeight: 700, marginBottom: 16 }}>Portfólio</p>
      <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 20, fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>Cases Similares</h2>
      <p style={{ color: '#999', maxWidth: 500, marginBottom: 30, fontSize: 13 }}>
        Conheça alguns dos projetos que demonstram nossa capacidade de produção e direção criativa.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {cases.map((c, i) => {
          const thumb = c.vimeoId ? thumbnails[c.vimeoId] : null
          return (
            <div key={c.id || i} style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: '#111', aspectRatio: '16/9' }}>
              {thumb && <img src={thumb} alt='' style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>{c.titulo}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <p style={{ fontSize: 11, color: '#999' }}>{c.descricao}</p>
                  {c.tipo && (
                    <PdfBadge bg='rgba(255,255,255,0.1)' color='rgba(255,255,255,0.8)' fontSize={9} letterSpacing={2} padding='3px 10px' border='1px solid rgba(255,255,255,0.1)'>
                      {c.tipo}
                    </PdfBadge>
                  )}
                </div>
              </div>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 14, border: '1px solid #333', pointerEvents: 'none' }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PdfEntregaveis({ entregaveis }: { entregaveis: any[] }) {
  if (!entregaveis || entregaveis.length === 0) return null

  const merged: any[] = []
  let servicosBlock: any | null = null
  for (const bloco of entregaveis) {
    if (bloco.label === 'Serviços' && bloco.cards) {
      if (!servicosBlock) { servicosBlock = { ...bloco, cards: [...bloco.cards] }; merged.push(servicosBlock) }
      else { servicosBlock.cards.push(...bloco.cards) }
    } else { merged.push(bloco) }
  }

  return (
    <div style={{ padding: '50px 60px' }}>
      <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#4CFF5C', fontWeight: 700, marginBottom: 16 }}>O que está incluso</p>
      <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 30, fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>Entregáveis</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {merged.map((bloco: any, bIdx: number) => (
          <div key={bIdx}>
            <p style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#4CFF5C', marginBottom: 6 }}>{bloco.label}</p>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>{bloco.titulo}</h3>
            {'itens' in bloco && bloco.itens && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {bloco.itens.map((item: any, idx: number) => {
                  const isEmoji = item.icone && /\p{Emoji}/u.test(item.icone)
                  const Icon = !isEmoji ? (iconMap[item.icone] || iconMap[item.titulo] || Video) : null
                  return (
                    <div key={idx} style={{ padding: 22, background: '#111', borderRadius: 14, border: '1px solid #222' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        {isEmoji
                          ? <PdfCenteredEmoji emoji={item.icone} size={34} fontSize={16} />
                          : Icon && <PdfCenteredIcon Icon={Icon} size={34} iconSize={16} borderRadius={8} background='rgba(76,255,92,0.1)' color='#4CFF5C' />
                        }
                        {item.quantidade && <span style={{ fontSize: 24, fontWeight: 800, color: 'rgba(76,255,92,0.2)', fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>{item.quantidade}</span>}
                      </div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{item.titulo}</h4>
                      <p style={{ fontSize: 11, color: '#999', lineHeight: 1.5 }}>{item.descricao}</p>
                    </div>
                  )
                })}
              </div>
            )}
            {'cards' in bloco && bloco.cards && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {bloco.cards.map((card: any, cIdx: number) => {
                  const isEmoji = card.icone && /\p{Emoji}/u.test(card.icone)
                  const Icon = !isEmoji ? (iconMap[card.icone] || ClipboardList) : null
                  return (
                    <div key={cIdx} style={{ padding: 22, background: '#111', borderRadius: 14, border: '1px solid #222' }}>
                      <div style={{ marginBottom: 12 }}>
                        {isEmoji
                          ? <PdfCenteredEmoji emoji={card.icone} size={34} fontSize={16} />
                          : Icon && <PdfCenteredIcon Icon={Icon} size={34} iconSize={16} borderRadius={8} background='rgba(76,255,92,0.1)' color='#4CFF5C' />
                        }
                      </div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{card.titulo}</h4>
                      {card.itens && card.itens.map((item: any, iIdx: number) => (
                        <PdfCheckItem key={iIdx} nome={item.nome} ativo={item.ativo} quantidade={item.quantidade} />
                      ))}
                      {card.subcategorias && card.subcategorias.map((sub: any, sIdx: number) => (
                        <div key={sIdx} style={{ marginBottom: 10 }}>
                          <p style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#666', marginBottom: 6, marginTop: 8 }}>{sub.nome}</p>
                          {sub.itens.map((item: any, siIdx: number) => (
                            <PdfCheckItem key={siIdx} nome={item.nome} ativo={item.ativo} quantidade={item.quantidade} />
                          ))}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function PdfInvestimento({ proposal }: { proposal: Proposal }) {
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v)
  const hasDiscount = proposal.discount_pct > 0
  const valorTabela = proposal.list_price ? fmt(proposal.list_price) : fmt(proposal.base_value)
  const valorFinal = fmt(proposal.final_value)
  const options = proposal.payment_options.length > 0 ? proposal.payment_options : [
    { titulo: 'Opção 1', valor: 'À Vista', descricao: 'Pagamento único com', destaque: '5% de desconto' },
    { titulo: 'Opção 2', valor: '2x', descricao: '50% na aprovação / 50% em 30 dias', recomendado: true },
  ]

  return (
    <div style={{ padding: '50px 60px' }}>
      <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#4CFF5C', fontWeight: 700, marginBottom: 16 }}>Valores</p>
      <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 30, fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>Investimento</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#111', borderRadius: 14, border: '1px solid #222', padding: 32, display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#999', marginBottom: 10 }}>Valor Total do Projeto</p>
          {hasDiscount && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 6 }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#555', textDecoration: 'line-through', opacity: 0.5, fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>{valorTabela}</p>
              <PdfBadge bg='rgba(76,255,92,0.1)' color='#4CFF5C' fontSize={10} letterSpacing={2} padding='3px 10px'>
                -{proposal.discount_pct}%
              </PdfBadge>
            </div>
          )}
          <p style={{ fontSize: 48, fontWeight: 700, color: '#4CFF5C', margin: '20px 0', fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>{valorFinal}</p>
          <p style={{ fontSize: 11, color: '#999', marginTop: 'auto' }}>*Valores sujeitos a alteração conforme escopo final do projeto</p>
        </div>
        <div style={{ background: '#111', borderRadius: 14, border: '1px solid #222', padding: 32, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {options.map((cond, i) => (
              <div key={i} style={{ position: 'relative', padding: 16, background: '#0A0A0A', borderRadius: 10, textAlign: 'center', border: `1px solid ${cond.recomendado ? '#4CFF5C' : '#333'}` }}>
                {cond.recomendado && (
                  <div style={{ position: 'absolute', top: -8, left: 0, width: '100%', textAlign: 'center' }}>
                    <PdfBadge bg='#4CFF5C' color='#000' fontSize={8} letterSpacing={1} padding='2px 10px'>
                      Recomendado
                    </PdfBadge>
                  </div>
                )}
                <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>{cond.titulo}</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#f0f0f0', marginBottom: 4, fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>{cond.valor}</p>
                <p style={{ fontSize: 10, color: '#999' }}>
                  {cond.descricao}
                  {cond.destaque && <><br /><strong style={{ color: '#4CFF5C' }}>{cond.destaque}</strong></>}
                </p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: '#999', fontStyle: 'italic', marginBottom: 20 }}>{proposal.payment_terms}</p>
          {(proposal.testimonial_text || true) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 16, borderTop: '1px solid #333', marginTop: 'auto' }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                <img
                  src={proposal.testimonial_image || '/proposal-assets/Depoimento.png'}
                  alt=''
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 5%', transform: 'scale(1.5)' }}
                />
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#ccc', lineHeight: 1.5, fontStyle: 'italic', marginBottom: 4 }}>
                  "{proposal.testimonial_text || 'O vídeo ficou excelente, de verdade! Eu amei o resultado e a qualidade do trabalho de vocês. Parabéns pela entrega!'}"
                </p>
                <p style={{ fontSize: 10 }}>
                  <span style={{ fontWeight: 700, color: '#f0f0f0' }}>{proposal.testimonial_name || 'Thiago Nigro'}</span>
                  <span style={{ color: '#666' }}> — {proposal.testimonial_role || 'CEO, Grupo Primo'}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PdfProximosPassos({ validityDate }: { validityDate: string }) {
  const dataLimite = (() => {
    try { return format(new Date(validityDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) } catch { return validityDate }
  })()
  const steps = [
    { num: 1, title: 'Briefing', status: 'done' as const },
    { num: 2, title: 'Proposta', status: 'current' as const },
    { num: 3, title: 'Kick-off', status: 'locked' as const },
    { num: 4, title: 'Gravação', status: 'locked' as const },
  ]
  return (
    <div style={{ padding: '50px 60px' }}>
      <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#4CFF5C', fontWeight: 700, marginBottom: 16 }}>Vamos começar?</p>
      <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16, fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>Próximos Passos</h2>
      <p style={{ color: '#999', maxWidth: 450, fontSize: 13, marginBottom: 32 }}>
        Para garantir as datas do seu projeto, precisamos da aprovação até <span style={{ color: '#f0f0f0', fontWeight: 700 }}>{dataLimite}</span>.
      </p>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {steps.map((step, i) => {
          const borderColor = step.status === 'done' ? '#4CFF5C' : step.status === 'current' ? '#f0f0f0' : '#555'
          const bg = step.status === 'done' ? 'rgba(76,255,92,0.1)' : step.status === 'current' ? 'rgba(255,255,255,0.1)' : 'transparent'
          const fg = step.status === 'done' ? '#4CFF5C' : step.status === 'current' ? '#f0f0f0' : '#555'
          const circleSize = 48

          return (
            <div key={step.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: 100 }}>
              {i < steps.length - 1 && (
                <div style={{ position: 'absolute', top: 22, left: 72, width: 52, height: 1, background: step.status === 'done' ? 'rgba(76,255,92,0.3)' : '#333' }} />
              )}
              {step.status === 'done' ? (
                <PdfCenteredIcon Icon={Check} size={circleSize} iconSize={22} borderRadius='50%' background={bg} color={fg} border={`2px solid ${borderColor}`} />
              ) : step.status === 'locked' ? (
                <PdfCenteredIcon Icon={Lock} size={circleSize} iconSize={18} borderRadius='50%' background={bg} color={fg} border={`2px solid ${borderColor}`} />
              ) : (
                <div style={{ width: circleSize, height: circleSize, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${borderColor}`, background: bg, position: 'relative' }}>
                  <PdfCenteredText text={String(step.num)} size={circleSize} fontSize={16} color={fg} />
                </div>
              )}
              <h4 style={{ fontSize: 12, fontWeight: 700, color: fg, marginTop: 10 }}>{step.title}</h4>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PdfFooter({ footerPngDataUri }: { footerPngDataUri?: string }) {
  return (
    <div style={{ padding: '40px 60px 50px', marginTop: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 12, color: '#ccc', fontWeight: 700 }}>Telefone: +55 11 91449-5151</p>
          <p style={{ fontSize: 12, color: '#ccc', fontWeight: 700, marginTop: 10 }}>Email: contato@hiro.film</p>
          <p style={{ fontSize: 12, color: '#ccc', fontWeight: 700, marginTop: 10, maxWidth: 350 }}>
            Av. Sagitário, 138 - Edifício City, Salas 2506 à 2513 - Alphaville Conde II, Barueri - SP, 06473-073
          </p>
        </div>
        {footerPngDataUri ? (
          <img src={footerPngDataUri} alt='Hiro Films' style={{ height: 80 }} />
        ) : (
          <img src='/proposal-assets/Asset3.svg' alt='Hiro Films' style={{ height: 80 }} />
        )}
      </div>
      <div style={{ borderTop: '1px solid #333', marginTop: 30, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 10, color: '#666' }}>Esta proposta é confidencial e destinada exclusivamente ao destinatário.</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main PDF Document                                                 */
/* ------------------------------------------------------------------ */

export const ProposalPdfDocument = forwardRef<HTMLDivElement, Props>(
  ({ proposal, caseThumbnails, footerPngDataUri }, ref) => {
    const pageStyle: React.CSSProperties = {
      width: PAGE_WIDTH,
      minHeight: PAGE_MIN_HEIGHT,
      background: '#0A0A0A',
      color: '#f5f5f5',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      boxSizing: 'border-box',
    }

    return (
      <div
        ref={ref}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          zIndex: -1,
          width: PAGE_WIDTH,
          pointerEvents: 'none',
        }}
      >
        <div className='proposal-pdf-page' style={{ ...pageStyle, display: 'flex', flexDirection: 'column' }}>
          <PdfHero proposal={proposal} />
          <div style={{ marginTop: 'auto' }}>
            <div style={{ margin: '0 60px', height: 1, background: '#222' }} />
            <PdfClients />
          </div>
        </div>

        <div className='proposal-pdf-page' style={pageStyle}>
          <PdfDiagnostico proposal={proposal} />
        </div>

        {proposal.cases.length > 0 && (
          <div className='proposal-pdf-page' style={pageStyle}>
            <PdfCases cases={proposal.cases} thumbnails={caseThumbnails} />
          </div>
        )}

        {proposal.entregaveis.length > 0 && (
          <div className='proposal-pdf-page' style={pageStyle}>
            <PdfEntregaveis entregaveis={proposal.entregaveis} />
          </div>
        )}

        <div className='proposal-pdf-page' style={{ ...pageStyle, display: 'flex', flexDirection: 'column' }}>
          <div style={{ margin: '0 60px', height: 1, background: '#222' }} />
          <PdfInvestimento proposal={proposal} />
          <div style={{ margin: '0 60px', height: 1, background: '#222' }} />
          <PdfProximosPassos validityDate={proposal.validity_date} />
          <div style={{ margin: '0 60px', height: 1, background: '#222' }} />
          <PdfFooter footerPngDataUri={footerPngDataUri} />
        </div>
      </div>
    )
  }
)

ProposalPdfDocument.displayName = 'ProposalPdfDocument'
