import { Equipment } from '@/types/equipment';
import { Edit, Trash2, Calendar, UserCheck, Package, Link as LinkIcon } from 'lucide-react';
import { useEquipmentCard } from '@/hooks/useEquipmentCard';
import { useCategories } from '@/hooks/useCategories';
import { StatusPill } from '@/ds/components/StatusPill';

interface EquipmentCardProps {
  equipment: Equipment;
  onEdit: (equipment: Equipment) => void;
  onDelete: (id: string) => void;
  onLoan?: (equipment: Equipment) => void;
  onReturn?: (equipment: Equipment) => void;
  accessoryCount?: number;
}

const TONE_BY_STATUS: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  available: 'success',
  in_use: 'info',
  maintenance: 'warning',
  loaned: 'warning',
  damaged: 'danger',
};

export function EquipmentCard({
  equipment,
  onEdit,
  onDelete,
  onLoan,
  accessoryCount = 0,
}: EquipmentCardProps) {
  const { getCategoryTitle } = useCategories();
  const { getStatusLabel, formatCurrency, getHierarchyIndicator } = useEquipmentCard();
  const hierarchyInfo = getHierarchyIndicator(equipment, accessoryCount);

  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'hsl(var(--ds-line-3))';
        e.currentTarget.style.boxShadow = '0 4px 12px hsl(0 0% 0% / 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid hsl(var(--ds-line-2))' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 16,
                fontWeight: 600,
                color: 'hsl(var(--ds-fg-1))',
                lineHeight: 1.2,
              }}
            >
              {equipment.name}
            </h3>
            <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
              {equipment.brand}
            </p>
          </div>
          <StatusPill
            label={getStatusLabel(equipment.status)}
            tone={TONE_BY_STATUS[equipment.status] ?? 'success'}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <span className="pill muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {hierarchyInfo.icon === 'package' && <Package size={11} strokeWidth={1.5} />}
            {hierarchyInfo.icon === 'link' && <LinkIcon size={11} strokeWidth={1.5} />}
            {hierarchyInfo.label}
          </span>
        </div>
      </div>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ color: 'hsl(var(--ds-fg-3))' }}>Categoria</span>
            <span style={{ color: 'hsl(var(--ds-fg-2))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {getCategoryTitle(equipment.category)}
            </span>
          </div>

          {equipment.patrimonyNumber && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: 'hsl(var(--ds-fg-3))' }}>Patrimônio</span>
              <span style={{ color: 'hsl(var(--ds-fg-2))', fontVariantNumeric: 'tabular-nums' }}>
                {equipment.patrimonyNumber}
              </span>
            </div>
          )}

          {equipment.purchaseDate && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'hsl(var(--ds-fg-3))' }}>
              <Calendar size={12} strokeWidth={1.5} />
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                Comprado em {new Date(equipment.purchaseDate).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}

          {equipment.value && (
            <div style={{ fontWeight: 600, color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
              {formatCurrency(equipment.value)}
            </div>
          )}
        </div>

        {equipment.currentBorrower && (
          <div
            style={{
              padding: '10px 12px',
              background: 'hsl(var(--ds-accent) / 0.05)',
              border: '1px solid hsl(var(--ds-accent) / 0.2)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 500,
                color: 'hsl(var(--ds-accent))',
              }}
            >
              <UserCheck size={13} strokeWidth={1.5} />
              <span>Em projetos</span>
            </div>
            <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
              Último empréstimo: {equipment.currentBorrower}
            </p>
            {equipment.lastLoanDate && (
              <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                Retirado em {new Date(equipment.lastLoanDate).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        )}

        {equipment.description && (
          <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', lineHeight: 1.5 }}>
            {equipment.description}
          </p>
        )}

        {equipment.serialNumber && (
          <div style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>
            S/N: {equipment.serialNumber}
          </div>
        )}
      </div>

      <div
        style={{
          padding: '12px 18px',
          borderTop: '1px solid hsl(var(--ds-line-2))',
          display: 'flex',
          gap: 6,
        }}
      >
        <button
          type="button"
          className="btn"
          style={{ flex: 1, justifyContent: 'center', height: 30, fontSize: 12 }}
          onClick={() => onEdit(equipment)}
        >
          <Edit size={12} strokeWidth={1.5} />
          <span>Editar</span>
        </button>

        {onLoan && (
          <button
            type="button"
            className="btn"
            style={{
              height: 30,
              fontSize: 12,
              color: 'hsl(var(--ds-success))',
              borderColor: 'hsl(var(--ds-success) / 0.3)',
            }}
            onClick={() => onLoan(equipment)}
          >
            <UserCheck size={12} strokeWidth={1.5} />
            <span>Retirar</span>
          </button>
        )}

        <button
          type="button"
          className="btn"
          style={{
            width: 30,
            height: 30,
            padding: 0,
            justifyContent: 'center',
            color: 'hsl(var(--ds-danger))',
            borderColor: 'hsl(var(--ds-danger) / 0.3)',
          }}
          onClick={() => onDelete(equipment.id)}
          aria-label="Excluir"
        >
          <Trash2 size={12} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
