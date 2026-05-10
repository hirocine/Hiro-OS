import { useState, useEffect } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Mail, MessageSquare, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { sendReminderNotification } from '@/lib/communication';
import { MobileFriendlyForm, MobileFriendlyFormActions } from '@/components/ui/mobile-friendly-form';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanData: {
    id: string;
    equipmentName: string;
    borrowerName: string;
    borrowerEmail?: string;
    borrowerPhone?: string;
    expectedReturnDate: string;
    loanDate: string;
    overdueDays: number;
  } | null;
}

type ReminderType = 'email' | 'sms' | 'notification';

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={fieldLabel}>{label}</label>
    {children}
  </div>
);

export function ReminderDialog({ open, onOpenChange, loanData }: ReminderDialogProps) {
  const [reminderType, setReminderType] = useState<ReminderType>('email');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const defaultMessages = {
    email: `Olá ${loanData?.borrowerName || '[Nome]'},

Espero que esteja tudo bem! Este é um lembrete amigável sobre o equipamento "${loanData?.equipmentName || '[Equipamento]'}" que foi emprestado em ${loanData?.loanDate ? new Date(loanData.loanDate).toLocaleDateString('pt-BR') : '[Data]'}.

A data prevista para devolução era ${loanData?.expectedReturnDate ? new Date(loanData.expectedReturnDate).toLocaleDateString('pt-BR') : '[Data Prevista]'}, e o equipamento está em atraso há ${loanData?.overdueDays || 0} dias.

Por favor, entre em contato conosco para combinarmos a devolução ou extensão do prazo.

Obrigado pela compreensão!

Equipe de Inventário`,
    sms: `Olá ${loanData?.borrowerName || '[Nome]'}! Lembrete: o equipamento "${loanData?.equipmentName || '[Equipamento]'}" está em atraso há ${loanData?.overdueDays || 0} dias. Por favor, entre em contato para combinarmos a devolução. Obrigado!`,
    notification: `Lembrete de devolução para ${loanData?.borrowerName || '[Nome]'}: equipamento "${loanData?.equipmentName || '[Equipamento]'}" em atraso há ${loanData?.overdueDays || 0} dias.`,
  };

  useEffect(() => {
    if (open && loanData) {
      setMessage(defaultMessages.email);
    }
  }, [open, loanData]);

  const handleSendReminder = async () => {
    if (!loanData || !message.trim()) {
      toast({
        title: 'Erro',
        description: 'Mensagem não pode estar vazia',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      await sendReminderNotification(reminderType, loanData, message);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: 'Lembrete Enviado',
        description: `${reminderType === 'email' ? 'Email' : reminderType === 'sms' ? 'SMS' : 'Notificação'} enviado com sucesso para ${loanData.borrowerName}`,
      });

      onOpenChange(false);
      setReminderType('email');
      setMessage('');
    } catch (error) {
      logger.error('Error sending reminder', { module: 'equipment', error });
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar o lembrete. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleTypeChange = (type: ReminderType) => {
    setReminderType(type);
    setMessage(defaultMessages[type]);
  };

  const getReminderIcon = (type: ReminderType) => {
    switch (type) {
      case 'email':
        return <Mail size={13} strokeWidth={1.5} />;
      case 'sms':
        return <Phone size={13} strokeWidth={1.5} />;
      case 'notification':
        return <MessageSquare size={13} strokeWidth={1.5} />;
    }
  };

  if (!loanData) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className={isMobile ? '' : 'max-w-2xl'}>
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
              <AlertTriangle size={18} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-warning))' }} />
              Enviar Lembrete de Devolução
            </span>
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <MobileFriendlyForm
          onSubmit={(e) => {
            e.preventDefault();
            handleSendReminder();
          }}
        >
          <div
            style={{
              border: '1px solid hsl(var(--ds-line-1))',
              background: 'hsl(var(--ds-surface))',
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--ds-fg-1))', fontFamily: '"HN Display", sans-serif' }}>
                {loanData.equipmentName}
              </h4>
              <span
                className="pill"
                style={{ color: 'hsl(var(--ds-danger))', borderColor: 'hsl(var(--ds-danger) / 0.3)' }}
              >
                {loanData.overdueDays} dias em atraso
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>
              <p>
                <strong style={{ color: 'hsl(var(--ds-fg-2))' }}>Responsável:</strong> {loanData.borrowerName}
              </p>
              {loanData.borrowerEmail && (
                <p>
                  <strong style={{ color: 'hsl(var(--ds-fg-2))' }}>Email:</strong> {loanData.borrowerEmail}
                </p>
              )}
              {loanData.borrowerPhone && (
                <p>
                  <strong style={{ color: 'hsl(var(--ds-fg-2))' }}>Telefone:</strong> {loanData.borrowerPhone}
                </p>
              )}
              <p style={{ fontVariantNumeric: 'tabular-nums' }}>
                <strong style={{ color: 'hsl(var(--ds-fg-2))' }}>Empréstimo:</strong>{' '}
                {new Date(loanData.loanDate).toLocaleDateString('pt-BR')}
              </p>
              <p style={{ fontVariantNumeric: 'tabular-nums' }}>
                <strong style={{ color: 'hsl(var(--ds-fg-2))' }}>Previsão:</strong>{' '}
                {new Date(loanData.expectedReturnDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <Field label="Tipo de Lembrete">
            <Select value={reminderType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email" disabled={!loanData.borrowerEmail}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={13} strokeWidth={1.5} />
                    Email
                    {!loanData.borrowerEmail && (
                      <span style={{ fontSize: 10, color: 'hsl(var(--ds-fg-4))' }}>(não disponível)</span>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="sms" disabled={!loanData.borrowerPhone}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={13} strokeWidth={1.5} />
                    SMS
                    {!loanData.borrowerPhone && (
                      <span style={{ fontSize: 10, color: 'hsl(var(--ds-fg-4))' }}>(não disponível)</span>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="notification">
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <MessageSquare size={13} strokeWidth={1.5} />
                    Notificação Interna
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Mensagem">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem aqui…"
              rows={reminderType === 'email' ? 10 : 4}
              style={{ resize: 'none' }}
            />
            <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 6 }}>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{message.length}</span> caracteres
              {reminderType === 'sms' && message.length > 160 && (
                <span style={{ color: 'hsl(var(--ds-warning))', marginLeft: 6 }}>
                  (SMS longo — pode ser cobrado como múltiplas mensagens)
                </span>
              )}
            </p>
          </Field>
        </MobileFriendlyForm>

        <ResponsiveDialogFooter>
          <MobileFriendlyFormActions>
            <button type="button" className="btn" onClick={() => onOpenChange(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={handleSendReminder}
              disabled={sending || !message.trim()}
            >
              {sending ? (
                <>
                  <div
                    className="animate-spin"
                    style={{
                      width: 14,
                      height: 14,
                      border: '2px solid currentColor',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                    }}
                  />
                  <span>Enviando…</span>
                </>
              ) : (
                <>
                  {getReminderIcon(reminderType)}
                  <span>Enviar Lembrete</span>
                </>
              )}
            </button>
          </MobileFriendlyFormActions>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
