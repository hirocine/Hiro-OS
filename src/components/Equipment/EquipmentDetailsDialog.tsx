import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Package, User, Clock, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { StatusPill } from '@/ds/components/StatusPill';

interface EquipmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string | null;
}

interface EquipmentDetails {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  patrimony_number?: string;
  serial_number?: string;
  description?: string;
  status: string;
  image?: string;
  purchase_date?: string;
  value?: number;
  depreciated_value?: number;
  last_maintenance?: string;
  receive_date?: string;
  store?: string;
  invoice?: string;
  current_borrower?: string;
  item_type: string;
}

interface LoanHistory {
  id: string;
  borrower_name: string;
  loan_date: string;
  expected_return_date: string;
  actual_return_date?: string;
  status: string;
  project?: string;
  department?: string;
  return_condition?: string;
  return_notes?: string;
}

const cardWrap: React.CSSProperties = {
  border: '1px solid hsl(var(--ds-line-1))',
  background: 'hsl(var(--ds-surface))',
};

const cardHeader: React.CSSProperties = {
  padding: '12px 18px',
  borderBottom: '1px solid hsl(var(--ds-line-1))',
};

const cardTitle: React.CSSProperties = {
  fontFamily: '"HN Display", sans-serif',
  fontSize: 14,
  fontWeight: 600,
  color: 'hsl(var(--ds-fg-1))',
};

const KV = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <span
      style={{
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        fontWeight: 500,
        color: 'hsl(var(--ds-fg-3))',
        display: 'block',
        marginBottom: 2,
      }}
    >
      {label}
    </span>
    <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-1))' }}>{value}</span>
  </div>
);

const TONE_BY_STATUS: Record<string, 'success' | 'warning' | 'danger'> = {
  available: 'success',
  on_loan: 'warning',
  maintenance: 'warning',
  damaged: 'danger',
  lost: 'danger',
};

const TONE_BY_LOAN_STATUS: Record<string, 'info' | 'danger' | 'success' | 'muted'> = {
  active: 'info',
  overdue: 'danger',
  returned: 'success',
};

export function EquipmentDetailsDialog({ open, onOpenChange, equipmentId }: EquipmentDetailsDialogProps) {
  const [equipment, setEquipment] = useState<EquipmentDetails | null>(null);
  const [loanHistory, setLoanHistory] = useState<LoanHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && equipmentId) {
      fetchEquipmentDetails();
      fetchLoanHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: fetch helper closes over the listed deps; missing deps are stable refs/setters
  }, [open, equipmentId]);

  const fetchEquipmentDetails = async () => {
    if (!equipmentId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('equipments').select('*').eq('id', equipmentId).single();
      if (error) throw error;
      setEquipment(data);
    } catch (error) {
      logger.error('Error fetching equipment details', { module: 'equipment', error });
    } finally {
      setLoading(false);
    }
  };

  const fetchLoanHistory = async () => {
    if (!equipmentId) return;
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('id, borrower_name, loan_date, expected_return_date, actual_return_date, status, project')
        .eq('equipment_id', equipmentId)
        .order('loan_date', { ascending: false });
      if (error) throw error;
      setLoanHistory((data as LoanHistory[]) || []);
    } catch (error) {
      logger.error('Error fetching loan history', { module: 'equipment', error });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle size={13} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-success))' }} />;
      case 'maintenance':
        return <Wrench size={13} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-warning))' }} />;
      case 'on_loan':
        return <User size={13} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-info))' }} />;
      default:
        return <Package size={13} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      available: 'Disponível',
      on_loan: 'Emprestado',
      maintenance: 'Manutenção',
      damaged: 'Danificado',
      lost: 'Perdido',
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (!equipment && !loading) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="w-full max-w-4xl max-h-[90vh] ds-shell">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: '"HN Display", sans-serif',
              }}
            >
              <Package size={18} strokeWidth={1.5} />
              {equipment?.name || 'Carregando…'}
            </span>
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
            <div
              className="animate-spin"
              style={{
                width: 28,
                height: 28,
                border: '2px solid hsl(var(--ds-accent))',
                borderTopColor: 'transparent',
                borderRadius: '50%',
              }}
            />
          </div>
        ) : equipment ? (
          <ScrollArea className="max-h-[calc(90vh-8rem)]">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                <div style={cardWrap}>
                  <div style={cardHeader}>
                    <span style={cardTitle}>Informações Gerais</span>
                  </div>
                  <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {equipment.image && (
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Avatar style={{ width: 76, height: 76 }}>
                          <AvatarImage src={equipment.image} alt={equipment.name} />
                          <AvatarFallback>
                            <Package size={28} strokeWidth={1.5} />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {getStatusIcon(equipment.status)}
                      <StatusPill
                        label={getStatusLabel(equipment.status)}
                        tone={TONE_BY_STATUS[equipment.status] ?? 'success'}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <KV label="Marca" value={equipment.brand} />
                      <KV label="Categoria" value={equipment.category} />
                      {equipment.subcategory && <KV label="Subcategoria" value={equipment.subcategory} />}
                      {equipment.patrimony_number && (
                        <KV label="Patrimônio" value={<span style={{ fontVariantNumeric: 'tabular-nums' }}>#{equipment.patrimony_number}</span>} />
                      )}
                      {equipment.serial_number && (
                        <KV label="Série" value={<span style={{ fontVariantNumeric: 'tabular-nums' }}>{equipment.serial_number}</span>} />
                      )}
                    </div>
                  </div>
                </div>

                <div style={cardWrap}>
                  <div style={cardHeader}>
                    <span style={cardTitle}>Detalhes Técnicos</span>
                  </div>
                  <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {equipment.description && (
                      <div>
                        <span
                          style={{
                            fontSize: 10,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            fontWeight: 500,
                            color: 'hsl(var(--ds-fg-3))',
                            display: 'block',
                            marginBottom: 4,
                          }}
                        >
                          Descrição
                        </span>
                        <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))', lineHeight: 1.5 }}>
                          {equipment.description}
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                      {equipment.purchase_date && (
                        <KV
                          label="Data de Compra"
                          value={
                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {new Date(equipment.purchase_date).toLocaleDateString('pt-BR')}
                            </span>
                          }
                        />
                      )}
                      {equipment.receive_date && (
                        <KV
                          label="Data de Recebimento"
                          value={
                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {new Date(equipment.receive_date).toLocaleDateString('pt-BR')}
                            </span>
                          }
                        />
                      )}
                      {equipment.value && (
                        <KV
                          label="Valor de Compra"
                          value={
                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {formatCurrency(equipment.value)}
                            </span>
                          }
                        />
                      )}
                      {equipment.depreciated_value && (
                        <KV
                          label="Valor Depreciado"
                          value={
                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {formatCurrency(equipment.depreciated_value)}
                            </span>
                          }
                        />
                      )}
                      {equipment.store && <KV label="Loja" value={equipment.store} />}
                      {equipment.invoice && <KV label="Nota Fiscal" value={equipment.invoice} />}
                      {equipment.last_maintenance && (
                        <KV
                          label="Última Manutenção"
                          value={
                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {new Date(equipment.last_maintenance).toLocaleDateString('pt-BR')}
                            </span>
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={cardWrap}>
                <div style={cardHeader}>
                  <span style={{ ...cardTitle, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={14} strokeWidth={1.5} />
                    Histórico de Empréstimos
                  </span>
                  <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                    {loanHistory.length === 0
                      ? 'Nenhum empréstimo registrado para este equipamento'
                      : `${loanHistory.length} empréstimo(s) registrado(s)`}
                  </p>
                </div>
                <div style={{ padding: 18 }}>
                  {loanHistory.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {loanHistory.map((loan) => (
                        <div
                          key={loan.id}
                          style={{
                            border: '1px solid hsl(var(--ds-line-2))',
                            padding: 14,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <User size={13} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                              <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                                {loan.borrower_name}
                              </span>
                              <StatusPill
                                label={
                                  loan.status === 'active'
                                    ? 'Ativo'
                                    : loan.status === 'overdue'
                                    ? 'Atrasado'
                                    : loan.status === 'returned'
                                    ? 'Devolvido'
                                    : loan.status
                                }
                                tone={TONE_BY_LOAN_STATUS[loan.status] ?? 'muted'}
                                icon={
                                  loan.status === 'overdue'
                                    ? '⏰'
                                    : loan.status === 'returned'
                                    ? '✓'
                                    : undefined
                                }
                              />
                            </div>
                            <div style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                              {formatDistanceToNow(new Date(loan.loan_date), { addSuffix: true, locale: ptBR })}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                            <KV
                              label="Data Empréstimo"
                              value={
                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                                  {new Date(loan.loan_date).toLocaleDateString('pt-BR')}
                                </span>
                              }
                            />
                            <KV
                              label="Previsão Retorno"
                              value={
                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                                  {new Date(loan.expected_return_date).toLocaleDateString('pt-BR')}
                                </span>
                              }
                            />
                            {loan.actual_return_date && (
                              <KV
                                label="Data Retorno"
                                value={
                                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                                    {new Date(loan.actual_return_date).toLocaleDateString('pt-BR')}
                                  </span>
                                }
                              />
                            )}
                            {loan.project && <KV label="Projeto" value={loan.project} />}
                          </div>

                          {loan.return_condition && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                              <span style={{ color: 'hsl(var(--ds-fg-3))' }}>Condição de Retorno:</span>
                              <span className="pill muted">{loan.return_condition}</span>
                            </div>
                          )}

                          {loan.return_notes && (
                            <div style={{ fontSize: 12 }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  letterSpacing: '0.14em',
                                  textTransform: 'uppercase',
                                  fontWeight: 500,
                                  color: 'hsl(var(--ds-fg-3))',
                                  display: 'block',
                                  marginBottom: 4,
                                }}
                              >
                                Observações
                              </span>
                              <p style={{ color: 'hsl(var(--ds-fg-2))', lineHeight: 1.5 }}>
                                {loan.return_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'hsl(var(--ds-fg-3))', fontSize: 12 }}>
                      <Package size={36} strokeWidth={1.25} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
                      <p>Este equipamento ainda não foi emprestado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'hsl(var(--ds-fg-3))' }}>
            <AlertTriangle size={36} strokeWidth={1.25} style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 13 }}>Equipamento não encontrado</p>
          </div>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
