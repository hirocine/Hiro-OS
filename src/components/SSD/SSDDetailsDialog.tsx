import { useState, useEffect } from 'react';
import { Equipment } from '@/types/equipment';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/ds/components/StatusPill';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, HardDrive } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCapacity } from '@/lib/utils';
import { capitalizeNames } from '@/lib/stringUtils';
import { useUsers } from '@/hooks/useUsers';
import { useSSDDetails, SSDExternalLoan } from '@/features/ssds/hooks/useSSDDetails';
import { SSDStatus } from '@/features/ssds';
import { ProjectAllocationList, ProjectAllocation } from './ProjectAllocationList';

interface SSDDetailsDialogProps {
  ssd: Equipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={fieldLabel}>
      {label}
      {required && <span style={{ marginLeft: 4, color: 'hsl(var(--ds-danger))' }}>*</span>}
    </label>
    {children}
  </div>
);

export const SSDDetailsDialog = ({ ssd, open, onOpenChange, onUpdate }: SSDDetailsDialogProps) => {
  const { users } = useUsers();
  const { allocations, externalLoan, loading, updateSSD } = useSSDDetails(ssd);

  const [status, setStatus] = useState<SSDStatus>('available');
  const [internalUserId, setInternalUserId] = useState<string>('');
  const [ssdNumber, setSsdNumber] = useState('');
  const [externalBorrowerName, setExternalBorrowerName] = useState('');
  const [loanDate, setLoanDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [projectAllocations, setProjectAllocations] = useState<ProjectAllocation[]>([]);

  useEffect(() => {
    if (ssd && open) {
      let currentStatus: SSDStatus = 'available';
      if (ssd.displayOrder && ssd.displayOrder >= 2000) currentStatus = 'loaned';
      else if (ssd.displayOrder && ssd.displayOrder >= 1000) currentStatus = 'in_use';

      setStatus(currentStatus);
      setInternalUserId(ssd.internal_user_id || '');
      setSsdNumber(ssd.ssdNumber || '');
      setProjectAllocations(allocations || []);

      if (externalLoan) {
        setExternalBorrowerName(externalLoan.borrower_name);
        setLoanDate(new Date(externalLoan.loan_date));
        setReturnDate(new Date(externalLoan.expected_return_date));
      } else {
        setExternalBorrowerName('');
        setLoanDate(undefined);
        setReturnDate(undefined);
      }
    }
  }, [ssd, open, allocations, externalLoan]);

  const handleSave = async () => {
    if (!ssd) return;

    if (status === 'in_use' && !internalUserId) {
      toast.error('Selecione um responsável interno');
      return;
    }

    if (status === 'loaned') {
      if (!externalBorrowerName.trim()) {
        toast.error('Digite o nome do tomador externo');
        return;
      }
      if (!loanDate || !returnDate) {
        toast.error('Preencha as datas de empréstimo e devolução');
        return;
      }
      if (returnDate < loanDate) {
        toast.error('A data de devolução deve ser posterior à data de empréstimo');
        return;
      }
    }

    const totalAllocated = projectAllocations.reduce((sum, a) => sum + (a.allocated_gb || 0), 0);
    if (ssd.capacity && totalAllocated > ssd.capacity) {
      toast.error(`A capacidade total foi ultrapassada em ${(totalAllocated - ssd.capacity).toFixed(0)} GB`);
      return;
    }

    let externalLoanData: SSDExternalLoan | null = null;
    if (status === 'loaned' && loanDate && returnDate) {
      externalLoanData = {
        ssd_id: ssd.id,
        borrower_name: capitalizeNames(externalBorrowerName),
        loan_date: format(loanDate, 'yyyy-MM-dd'),
        expected_return_date: format(returnDate, 'yyyy-MM-dd'),
      };
    }

    const success = await updateSSD(
      status,
      status === 'in_use' ? internalUserId : null,
      projectAllocations,
      externalLoanData,
      ssdNumber.trim() || null
    );

    if (success) {
      onUpdate();
      onOpenChange(false);
    }
  };

  if (!ssd) return null;

  const totalAllocated = projectAllocations.reduce((sum, a) => sum + (a.allocated_gb || 0), 0);
  const freeSpace = (ssd.capacity || 0) - totalAllocated;
  const isLowSpace = ssd.capacity && freeSpace < ssd.capacity * 0.2;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-2xl">
        <ResponsiveDialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                display: 'grid',
                placeItems: 'center',
                background: 'hsl(var(--ds-accent) / 0.1)',
                color: 'hsl(var(--ds-accent))',
                flexShrink: 0,
              }}
            >
              <HardDrive size={18} strokeWidth={1.5} />
            </div>
            <div style={{ minWidth: 0 }}>
              <ResponsiveDialogTitle>
                <span style={{ fontFamily: '"HN Display", sans-serif' }}>{ssd.name}</span>
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatCapacity(ssd.capacity)}
                  {ssd.ssdNumber ? ` • #${ssd.ssdNumber}` : ''}
                </span>
              </ResponsiveDialogDescription>
            </div>
          </div>
        </ResponsiveDialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 12, paddingBottom: 12 }}>
          <Field label="Número do SSD">
            <Input
              value={ssdNumber}
              onChange={(e) => setSsdNumber(e.target.value)}
              placeholder="Ex: 01, 02, 03"
            />
            <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 6 }}>
              Identificador visual único (etiqueta física do SSD)
            </p>
          </Field>

          <Field label="Status">
            <Select value={status} onValueChange={(value) => setStatus(value as SSDStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Livre</SelectItem>
                <SelectItem value="in_use">Em uso (Interno)</SelectItem>
                <SelectItem value="loaned">Em uso (Externo)</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {status === 'in_use' && (
            <Field label="Responsável Interno" required>
              <Select value={internalUserId} onValueChange={setInternalUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.display_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {status === 'loaned' && (
            <div
              style={{
                border: '1px solid hsl(var(--ds-line-1))',
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <h3
                style={{
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  color: 'hsl(var(--ds-fg-3))',
                }}
              >
                Empréstimo Externo
              </h3>

              <Field label="Nome do Tomador" required>
                <Input
                  value={externalBorrowerName}
                  onChange={(e) => setExternalBorrowerName(e.target.value)}
                  onBlur={(e) => setExternalBorrowerName(capitalizeNames(e.target.value))}
                  placeholder="Ex: João Silva"
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <Field label="Data de Empréstimo" required>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="btn"
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          gap: 8,
                          color: loanDate ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-4))',
                        }}
                      >
                        <CalendarIcon size={14} strokeWidth={1.5} />
                        {loanDate ? format(loanDate, 'dd/MM/yyyy') : 'Selecione'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={loanDate}
                        onSelect={setLoanDate}
                        locale={ptBR}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </Field>

                <Field label="Data de Devolução" required>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="btn"
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          gap: 8,
                          color: returnDate ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-4))',
                        }}
                      >
                        <CalendarIcon size={14} strokeWidth={1.5} />
                        {returnDate ? format(returnDate, 'dd/MM/yyyy') : 'Selecione'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={setReturnDate}
                        locale={ptBR}
                        disabled={(date) => (loanDate ? date < loanDate : false)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </Field>
              </div>
            </div>
          )}

          {(status === 'in_use' || status === 'loaned') && ssd.capacity && (
            <div style={{ border: '1px solid hsl(var(--ds-line-1))', padding: 14 }}>
              <ProjectAllocationList
                allocations={projectAllocations}
                totalCapacity={ssd.capacity}
                onChange={setProjectAllocations}
              />
            </div>
          )}

          {(status === 'in_use' || status === 'loaned') && ssd.capacity && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'hsl(var(--ds-line-2) / 0.4)',
                border: '1px solid hsl(var(--ds-line-2))',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  color: 'hsl(var(--ds-fg-3))',
                }}
              >
                Espaço Livre
              </span>
              <StatusPill
                label={`${freeSpace.toFixed(0)} GB de ${ssd.capacity} GB`}
                tone={isLowSpace ? 'danger' : 'success'}
              />
            </div>
          )}
        </div>

        <ResponsiveDialogFooter>
          <button type="button" className="btn" onClick={() => onOpenChange(false)}>
            Cancelar
          </button>
          <button type="button" className="btn primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando…' : 'Salvar'}
          </button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
