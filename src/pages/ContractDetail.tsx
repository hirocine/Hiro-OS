import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  ExternalLink,
  Download,
  Check,
  X,
  Link2,
  Save,
  Repeat,
  RefreshCcw,
  AlertCircle,
  Clock,
} from 'lucide-react';
import {
  useContracts,
  STATUS_LABEL,
  STATUS_TONE,
  VIGENCIA_LABEL,
  VIGENCIA_TONE,
  FREQUENCY_LABEL,
  recurringVigencia,
  daysUntil,
  noticeDeadline,
} from '@/features/contracts/useContracts';
import type { Contract, ContractSigner } from '@/features/contracts/types';
import { StatusPill } from '@/ds/components/StatusPill';
import { Money } from '@/ds/components/Money';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const HN_DISPLAY: React.CSSProperties = { fontFamily: '"HN Display", sans-serif' };
const EYEBROW: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
};

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, linkContract, setNotes } = useContracts();
  const contract = items.find((c) => c.id === id);

  const [linkOpen, setLinkOpen] = useState(false);
  const [notesEditing, setNotesEditing] = useState(false);
  const [notesDraft, setNotesDraft] = useState(contract?.notes ?? '');

  if (!contract) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner">
          <div style={{ padding: 64, textAlign: 'center' }}>
            <p style={{ color: 'hsl(var(--ds-fg-3))' }}>Contrato não encontrado.</p>
            <button className="btn" type="button" onClick={() => navigate('/juridico/contratos')}>
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        {/* Breadcrumb */}
        <button
          type="button"
          className="btn ghost sm"
          style={{ marginBottom: 12 }}
          onClick={() => navigate('/juridico/contratos')}
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          <span>Contratos</span>
        </button>

        {/* Header */}
        <div className="ph">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="ph-title" style={{ wordBreak: 'break-word' }}>
              {contract.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <StatusPill label={STATUS_LABEL[contract.status]} tone={STATUS_TONE[contract.status]} />
              {contract.contract_class === 'recurring' && (() => {
                const v = recurringVigencia(contract);
                return v ? (
                  <StatusPill
                    label={VIGENCIA_LABEL[v]}
                    tone={VIGENCIA_TONE[v]}
                    icon={<Repeat size={11} strokeWidth={1.5} />}
                  />
                ) : null;
              })()}
              {!contract.linked_at && (
                <StatusPill label="Sem vinculação" tone="warning" icon={<Link2 size={11} strokeWidth={1.5} />} />
              )}
              {contract.value_brl != null && (
                <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>
                  · <Money value={contract.value_brl} />
                </span>
              )}
            </div>
          </div>
          <div className="ph-actions">
            <a
              href={contract.zapsign_doc_url}
              target="_blank"
              rel="noreferrer"
              className="btn"
            >
              <ExternalLink size={14} strokeWidth={1.5} />
              <span>Abrir no ZapSign</span>
            </a>
            {contract.signed_pdf_url && (
              <a
                href={contract.signed_pdf_url}
                target="_blank"
                rel="noreferrer"
                className="btn primary"
              >
                <Download size={14} strokeWidth={1.5} />
                <span>Baixar PDF</span>
              </a>
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
            gap: 18,
          }}
        >
          {/* Coluna esquerda: timeline de assinaturas */}
          <Card title="Assinaturas">
            <SignersTimeline signers={contract.signers} contract={contract} />
          </Card>

          {/* Coluna direita: meta + vinculações */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {contract.contract_class === 'recurring' && contract.recurrence && (
              <RecurrenceCard contract={contract} />
            )}

            <Card title="Vinculação">
              {contract.linked_client_name || contract.linked_project_name || contract.linked_supplier_name ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {contract.linked_client_name && (
                    <KV label="Cliente" value={contract.linked_client_name} />
                  )}
                  {contract.linked_project_name && (
                    <KV label="Projeto" value={contract.linked_project_name} />
                  )}
                  {contract.linked_supplier_name && (
                    <KV label="Fornecedor" value={contract.linked_supplier_name} />
                  )}
                  <button
                    type="button"
                    className="btn ghost sm"
                    style={{ alignSelf: 'flex-start' }}
                    onClick={() => setLinkOpen((v) => !v)}
                  >
                    <Link2 size={13} strokeWidth={1.5} />
                    <span>Editar vinculação</span>
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginBottom: 10 }}>
                    Vincule este contrato a um cliente, projeto ou fornecedor pra ele aparecer no contexto certo.
                  </p>
                  <button
                    type="button"
                    className="btn primary sm"
                    onClick={() => setLinkOpen(true)}
                  >
                    <Link2 size={13} strokeWidth={1.5} />
                    <span>Vincular agora</span>
                  </button>
                </>
              )}
              {linkOpen && (
                <LinkForm
                  contract={contract}
                  onSubmit={(payload) => {
                    linkContract(contract.id, payload);
                    setLinkOpen(false);
                  }}
                  onCancel={() => setLinkOpen(false)}
                />
              )}
            </Card>

            <Card title="Informações">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <KV
                  label="Criado"
                  value={format(new Date(contract.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                />
                {contract.sent_at && (
                  <KV
                    label="Enviado"
                    value={format(new Date(contract.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  />
                )}
                {contract.completed_at && (
                  <KV
                    label="Concluído"
                    value={format(new Date(contract.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  />
                )}
                {contract.expires_at && (
                  <KV
                    label="Expira"
                    value={format(new Date(contract.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                  />
                )}
                <KV label="Tipo" value={partyLabel(contract.party_type)} />
                <KV label="Doc ZapSign" value={contract.zapsign_doc_token} mono />
              </div>
            </Card>

            <Card title="Anotações">
              {notesEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={4}
                    placeholder="Notas internas sobre este contrato…"
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="btn primary sm"
                      onClick={() => {
                        setNotes(contract.id, notesDraft);
                        setNotesEditing(false);
                      }}
                    >
                      <Save size={13} strokeWidth={1.5} />
                      Salvar
                    </button>
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => {
                        setNotesDraft(contract.notes ?? '');
                        setNotesEditing(false);
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {contract.notes ? (
                    <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-1))', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {contract.notes}
                    </p>
                  ) : (
                    <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>Sem anotações.</p>
                  )}
                  <button
                    type="button"
                    className="btn ghost sm"
                    style={{ marginTop: 10 }}
                    onClick={() => {
                      setNotesDraft(contract.notes ?? '');
                      setNotesEditing(true);
                    }}
                  >
                    {contract.notes ? 'Editar' : 'Adicionar nota'}
                  </button>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
        }}
      >
        <span style={EYEBROW}>{title}</span>
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={EYEBROW}>{label}</span>
      <span
        style={{
          fontSize: 13,
          color: 'hsl(var(--ds-fg-1))',
          fontFamily: mono ? 'monospace' : undefined,
          wordBreak: mono ? 'break-all' : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SignersTimeline({
  signers,
  contract,
}: {
  signers: ContractSigner[];
  contract: Contract;
}) {
  return (
    <ol style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, margin: 0, listStyle: 'none' }}>
      {signers
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((s, idx) => {
          const isLast = idx === signers.length - 1;
          const status: 'signed' | 'refused' | 'waiting' = s.signed_at
            ? 'signed'
            : s.refused_at
              ? 'refused'
              : 'waiting';
          const StatusIcon = status === 'signed' ? Check : status === 'refused' ? X : Clock;
          const color =
            status === 'signed'
              ? 'hsl(var(--ds-success))'
              : status === 'refused'
                ? 'hsl(var(--ds-danger))'
                : 'hsl(var(--ds-fg-3))';
          const bg =
            status === 'signed'
              ? 'hsl(var(--ds-success) / 0.1)'
              : status === 'refused'
                ? 'hsl(var(--ds-danger) / 0.1)'
                : 'hsl(var(--ds-line-2) / 0.5)';

          return (
            <li key={s.zapsign_token} style={{ position: 'relative', display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 14 }}>
              {/* Connector line */}
              {!isLast && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: 13,
                    top: 28,
                    bottom: 0,
                    width: 1,
                    background: 'hsl(var(--ds-line-1))',
                  }}
                />
              )}

              {/* Status badge */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  display: 'grid',
                  placeItems: 'center',
                  background: bg,
                  border: `1px solid ${color.replace(')', ' / 0.3)')}`,
                  color,
                  flexShrink: 0,
                }}
              >
                <StatusIcon size={13} strokeWidth={1.5} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                    {s.name}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                      color: 'hsl(var(--ds-fg-4))',
                    }}
                  >
                    {s.role === 'internal' ? 'Interno' : 'Externo'} · #{s.position}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>{s.email}</p>

                {status === 'signed' && s.signed_at && (
                  <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
                    Assinou {formatDistanceToNow(new Date(s.signed_at), { addSuffix: true, locale: ptBR })}{' '}
                    <span style={{ color: 'hsl(var(--ds-fg-4))' }}>
                      ({format(new Date(s.signed_at), "dd/MM 'às' HH:mm", { locale: ptBR })})
                    </span>
                  </p>
                )}
                {status === 'refused' && s.refused_at && (
                  <p style={{ fontSize: 12, color: 'hsl(var(--ds-danger))', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
                    Recusou {formatDistanceToNow(new Date(s.refused_at), { addSuffix: true, locale: ptBR })}
                  </p>
                )}
                {status === 'waiting' && contract.sent_at && (
                  <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 6 }}>
                    Aguardando assinatura
                  </p>
                )}
                {status === 'waiting' && !contract.sent_at && (
                  <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 6 }}>
                    Documento ainda em rascunho
                  </p>
                )}
              </div>
            </li>
          );
        })}
    </ol>
  );
}

function LinkForm({
  contract,
  onSubmit,
  onCancel,
}: {
  contract: Contract;
  onSubmit: (payload: {
    project_id?: string | null;
    project_name?: string | null;
    client_id?: string | null;
    client_name?: string | null;
    supplier_id?: string | null;
    supplier_name?: string | null;
  }) => void;
  onCancel: () => void;
}) {
  // Mock — real impl will autocomplete from CRM contacts / projetos AV / fornecedores
  const [clientName, setClientName] = useState(contract.linked_client_name ?? '');
  const [projectName, setProjectName] = useState(contract.linked_project_name ?? '');
  const [supplierName, setSupplierName] = useState(contract.linked_supplier_name ?? '');

  return (
    <div
      style={{
        marginTop: 14,
        paddingTop: 14,
        borderTop: '1px solid hsl(var(--ds-line-1))',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={EYEBROW}>Cliente (CRM)</span>
        <Input
          placeholder="Buscar cliente…"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={EYEBROW}>Projeto AV</span>
        <Input
          placeholder="Buscar projeto…"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={EYEBROW}>Fornecedor</span>
        <Input
          placeholder="Buscar fornecedor…"
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
        />
      </label>
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button
          type="button"
          className="btn primary sm"
          onClick={() =>
            onSubmit({
              client_name: clientName.trim() || null,
              project_name: projectName.trim() || null,
              supplier_name: supplierName.trim() || null,
            })
          }
        >
          <Save size={13} strokeWidth={1.5} />
          Vincular
        </button>
        <button type="button" className="btn sm" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function partyLabel(p: Contract['party_type']) {
  const labels: Record<Contract['party_type'], string> = {
    client: 'Cliente',
    freelancer: 'Freelancer',
    company: 'Empresa',
    talent: 'Talent / Cessão de imagem',
    nda: 'NDA / Confidencialidade',
    other: 'Outro',
  };
  return labels[p];
}

/**
 * Card-rich view of a recurring contract's vigência state. Only renders
 * when `contract.recurrence` is set. Surfaces the four things that
 * legally matter: vigência window, próxima renovação, aviso prévio,
 * reajuste.
 */
function RecurrenceCard({ contract }: { contract: Contract }) {
  const r = contract.recurrence!;
  const vig = recurringVigencia(contract);
  const daysToEnd = daysUntil(r.end_date);
  const notice = noticeDeadline(contract);

  const adjustmentLabel: Record<typeof r.adjustment_index, string> = {
    IPCA: 'IPCA',
    IGPM: 'IGP-M',
    fixed_percent: r.adjustment_percent != null ? `${r.adjustment_percent}% fixo` : 'Percentual fixo',
    none: 'Sem reajuste',
  };

  // Cor do destaque do "próximo evento" — alinhado com a vigência
  const vigColor =
    vig === 'expiring_critical' || vig === 'expired'
      ? 'hsl(var(--ds-danger))'
      : vig === 'expiring_soon'
        ? 'hsl(var(--ds-warning))'
        : 'hsl(var(--ds-fg-2))';

  return (
    <Card title="Recorrência">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Destaque: próximo evento */}
        {daysToEnd !== null && (
          <div
            style={{
              padding: '12px 14px',
              border: `1px solid ${vigColor.replace(')', ' / 0.3)')}`,
              background: vigColor.replace(')', ' / 0.06)'),
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCcw size={14} strokeWidth={1.5} style={{ color: vigColor }} />
              <span style={{ fontSize: 12, color: vigColor, fontWeight: 600 }}>
                {daysToEnd >= 0
                  ? `Renova em ${daysToEnd} dia${daysToEnd !== 1 ? 's' : ''}`
                  : `Venceu há ${Math.abs(daysToEnd)} dia${Math.abs(daysToEnd) !== 1 ? 's' : ''}`}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-2))', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
              {format(new Date(r.end_date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            {r.auto_renew ? (
              <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                Auto-renova por mais um período de {FREQUENCY_LABEL[r.frequency].toLowerCase()}.
              </p>
            ) : (
              <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                Não renova automaticamente — precisa renegociar.
              </p>
            )}
          </div>
        )}

        {/* Aviso prévio crítico */}
        {notice && !r.auto_renew && (
          <NoticeBlock notice={notice} />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <KV label="Periodicidade" value={FREQUENCY_LABEL[r.frequency]} />
          <KV
            label="Vigência atual"
            value={`${format(new Date(r.start_date), 'dd/MM/yyyy', { locale: ptBR })} → ${format(
              new Date(r.end_date),
              'dd/MM/yyyy',
              { locale: ptBR },
            )}`}
          />
          <KV
            label="Auto-renovação"
            value={r.auto_renew ? 'Sim — renova sozinho' : 'Não — precisa nova assinatura'}
          />
          <KV
            label="Aviso prévio"
            value={`${r.notice_period_days} dia${r.notice_period_days !== 1 ? 's' : ''} antes do fim`}
          />
          <KV
            label="Reajuste"
            value={
              r.adjustment_index === 'none'
                ? 'Sem reajuste contratado'
                : `${adjustmentLabel[r.adjustment_index]}${
                    r.next_adjustment_at
                      ? ` · próximo em ${format(new Date(r.next_adjustment_at), 'dd/MM/yyyy', { locale: ptBR })}`
                      : ''
                  }`
            }
          />
        </div>
      </div>
    </Card>
  );
}

/** Inline callout sobre o último momento pra dar aviso de rescisão. */
function NoticeBlock({ notice }: { notice: { date: string; days_left: number } }) {
  const passed = notice.days_left < 0;
  const critical = !passed && notice.days_left <= 14;
  const color = passed
    ? 'hsl(var(--ds-danger))'
    : critical
      ? 'hsl(var(--ds-warning))'
      : 'hsl(var(--ds-fg-3))';

  return (
    <div
      style={{
        padding: '10px 12px',
        border: `1px solid ${color.replace(')', ' / 0.25)')}`,
        background: color.replace(')', ' / 0.05)'),
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      <AlertCircle size={13} strokeWidth={1.5} style={{ color, flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color, margin: 0 }}>
          {passed
            ? 'Janela de aviso prévio expirou'
            : critical
              ? `Aviso prévio expira em ${notice.days_left} dia${notice.days_left !== 1 ? 's' : ''}`
              : `Última data pra rescisão sem ônus: em ${notice.days_left}d`}
        </p>
        <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
          {format(new Date(notice.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}
