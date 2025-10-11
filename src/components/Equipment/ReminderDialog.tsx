import { useState } from 'react';
import { 
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Mail, MessageSquare, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { equipmentDebug } from '@/lib/debug';
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
    notification: `Lembrete de devolução para ${loanData?.borrowerName || '[Nome]'}: equipamento "${loanData?.equipmentName || '[Equipamento]'}" em atraso há ${loanData?.overdueDays || 0} dias.`
  };

  const handleSendReminder = async () => {
    if (!loanData || !message.trim()) {
      toast({
        title: "Erro",
        description: "Mensagem não pode estar vazia",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      equipmentDebug('Sending reminder', { 
        loanId: loanData.id, 
        type: reminderType,
        recipient: reminderType === 'email' ? loanData.borrowerEmail : loanData.borrowerPhone
      });

      // Integração com serviços de comunicação
      await sendReminderNotification(reminderType, loanData, message);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulated API call

      // Registrar a notificação no sistema
      const notificationData = {
        title: `Lembrete de Devolução Enviado`,
        description: `Lembrete ${reminderType} enviado para ${loanData.borrowerName} sobre o equipamento ${loanData.equipmentName}`,
        type: 'reminder_sent',
        related_entity: 'loan',
        entity_id: loanData.id,
        responsible_user_name: loanData.borrowerName,
        responsible_user_email: loanData.borrowerEmail || null
      };

      equipmentDebug('Creating notification record', notificationData);

      toast({
        title: "Lembrete Enviado",
        description: `${reminderType === 'email' ? 'Email' : reminderType === 'sms' ? 'SMS' : 'Notificação'} enviado com sucesso para ${loanData.borrowerName}`,
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      equipmentDebug('Error sending reminder', error);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar o lembrete. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setReminderType('email');
    setMessage('');
  };

  const handleTypeChange = (type: ReminderType) => {
    setReminderType(type);
    setMessage(defaultMessages[type]);
  };

  // Resetar o formulário quando o diálogo abrir
  useState(() => {
    if (open && loanData) {
      setMessage(defaultMessages.email);
    }
  });

  const getReminderIcon = (type: ReminderType) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <Phone className="h-4 w-4" />;
      case 'notification':
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (!loanData) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className={isMobile ? "" : "max-w-2xl"}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            Enviar Lembrete de Devolução
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <MobileFriendlyForm className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendReminder();
          }}
        >
          {/* Informações do Empréstimo */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{loanData.equipmentName}</h4>
                  <Badge variant="destructive">
                    {loanData.overdueDays} dias em atraso
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Responsável:</strong> {loanData.borrowerName}</p>
                  {loanData.borrowerEmail && (
                    <p><strong>Email:</strong> {loanData.borrowerEmail}</p>
                  )}
                  {loanData.borrowerPhone && (
                    <p><strong>Telefone:</strong> {loanData.borrowerPhone}</p>
                  )}
                  <p><strong>Empréstimo:</strong> {new Date(loanData.loanDate).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Previsão:</strong> {new Date(loanData.expectedReturnDate).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tipo de Lembrete */}
          <div className="space-y-2">
            <Label>Tipo de Lembrete</Label>
            <Select value={reminderType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email" disabled={!loanData.borrowerEmail}>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                    {!loanData.borrowerEmail && <span className="text-xs text-muted-foreground">(não disponível)</span>}
                  </div>
                </SelectItem>
                <SelectItem value="sms" disabled={!loanData.borrowerPhone}>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    SMS
                    {!loanData.borrowerPhone && <span className="text-xs text-muted-foreground">(não disponível)</span>}
                  </div>
                </SelectItem>
                <SelectItem value="notification">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Notificação Interna
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem aqui..."
              rows={reminderType === 'email' ? 10 : 4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {message.length} caracteres
              {reminderType === 'sms' && message.length > 160 && (
                <span className="text-muted-foreground ml-2">
                  (SMS longo - pode ser cobrado como múltiplas mensagens)
                </span>
              )}
            </p>
          </div>
        </MobileFriendlyForm>

        <ResponsiveDialogFooter>
          <MobileFriendlyFormActions>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendReminder} 
              disabled={sending || !message.trim()}
              className="gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  {getReminderIcon(reminderType)}
                  Enviar Lembrete
                </>
              )}
            </Button>
          </MobileFriendlyFormActions>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}