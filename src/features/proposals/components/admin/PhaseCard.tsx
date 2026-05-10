import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Clapperboard,
  Palette,
  MoreVertical,
  CheckSquare,
  Square,
  Eraser,
  type LucideIcon,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Phase, PhaseId, ServiceItem } from '@/lib/services-schema';
import { ServiceItemRow, ROW_GRID } from './ServiceItemRow';

const PHASE_ICONS: Record<PhaseId, LucideIcon> = {
  pre_producao: ClipboardList,
  gravacao: Clapperboard,
  pos_producao: Palette,
};

interface Props {
  phase: Phase;
  onTogglePhase: (enabled: boolean) => void;
  onUpdateItem: (
    subIdx: number,
    itemId: string,
    patch: Partial<Pick<ServiceItem, 'label' | 'specification' | 'quantity' | 'included'>>,
  ) => void;
  onAddItem: (subIdx: number, label?: string) => void;
  onRemoveItem: (subIdx: number, itemId: string) => void;
  onDuplicateItem: (subIdx: number, itemId: string) => void;
  onSelectAll: () => void;
  onUnselectAll: () => void;
  onClearSpecs: () => void;
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
};

export function PhaseCard({
  phase,
  onTogglePhase,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onDuplicateItem,
  onSelectAll,
  onUnselectAll,
  onClearSpecs,
}: Props) {
  const Icon = PHASE_ICONS[phase.id];
  const [pendingFocusSub, setPendingFocusSub] = useState<number | null>(null);
  const totalItems = phase.subcategories.reduce((acc, s) => acc + s.items.length, 0);
  const includedCount = phase.subcategories.reduce(
    (acc, s) => acc + s.items.filter((i) => i.included).length,
    0,
  );

  const handleAddItem = (subIdx: number) => {
    onAddItem(subIdx, '');
    setPendingFocusSub(subIdx);
  };

  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        overflow: 'hidden',
      }}
    >
      {/* Header da fase */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              background: phase.enabled ? 'hsl(var(--ds-accent) / 0.1)' : 'hsl(var(--ds-line-2) / 0.4)',
              color: phase.enabled ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-fg-3))',
              border: `1px solid ${phase.enabled ? 'hsl(var(--ds-accent) / 0.25)' : 'hsl(var(--ds-line-1))'}`,
              transition: 'background 0.15s, color 0.15s, border-color 0.15s',
            }}
          >
            <Icon size={14} strokeWidth={1.5} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h4
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.2,
                color: 'hsl(var(--ds-fg-1))',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {phase.name}
            </h4>
            <p
              style={{
                fontSize: 11,
                color: 'hsl(var(--ds-fg-3))',
                marginTop: 2,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {phase.enabled ? `${includedCount}/${totalItems} inclusos` : 'Fase desativada'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Switch
            checked={phase.enabled}
            onCheckedChange={onTogglePhase}
            aria-label={`Ativar ${phase.name}`}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              style={{
                width: 28,
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                color: 'hsl(var(--ds-fg-3))',
                transition: 'background 0.15s, color 0.15s',
              }}
              aria-label="Ações da fase"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.4)';
                e.currentTarget.style.color = 'hsl(var(--ds-fg-1))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'hsl(var(--ds-fg-3))';
              }}
            >
              <MoreVertical size={14} strokeWidth={1.5} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSelectAll}>
                <CheckSquare size={13} strokeWidth={1.5} style={{ marginRight: 8 }} /> Marcar todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onUnselectAll}>
                <Square size={13} strokeWidth={1.5} style={{ marginRight: 8 }} /> Desmarcar todos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onClearSpecs}>
                <Eraser size={13} strokeWidth={1.5} style={{ marginRight: 8 }} /> Limpar especificações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Conteúdo colapsável */}
      <AnimatePresence initial={false}>
        {phase.enabled && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            {/* Header de colunas */}
            <div
              className={ROW_GRID}
              style={{
                background: 'hsl(var(--ds-line-2) / 0.3)',
                borderBottom: '1px solid hsl(var(--ds-line-1))',
              }}
            >
              <div style={{ padding: '10px 0' }} />
              <div style={{ padding: '10px 12px', borderLeft: '1px solid hsl(var(--ds-line-1))', ...eyebrowStyle }}>
                Recurso
              </div>
              <div style={{ padding: '10px 12px', borderLeft: '1px solid hsl(var(--ds-line-1))', ...eyebrowStyle }}>
                Especificação
              </div>
              <div
                style={{
                  padding: '10px 12px',
                  borderLeft: '1px solid hsl(var(--ds-line-1))',
                  textAlign: 'right',
                  ...eyebrowStyle,
                }}
              >
                Qtd
              </div>
              <div style={{ padding: '10px 0', borderLeft: '1px solid hsl(var(--ds-line-1))' }} />
            </div>

            {/* Subcategorias + items */}
            {phase.subcategories.map((sub, subIdx) => (
              <div key={subIdx}>
                {sub.name && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'hsl(var(--ds-line-2) / 0.2)',
                      borderBottom: '1px solid hsl(var(--ds-line-1))',
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'hsl(var(--ds-fg-3))',
                    }}
                  >
                    {sub.name}
                  </div>
                )}

                <div>
                  {sub.items.map((item, itemIdx) => {
                    const isLast = itemIdx === sub.items.length - 1;
                    const shouldFocus =
                      pendingFocusSub === subIdx && isLast && item.isCustom && item.label === '';
                    return (
                      <ServiceItemRow
                        key={item.id}
                        item={item}
                        autoFocusLabel={shouldFocus}
                        onChange={(patch) => {
                          if (shouldFocus) setPendingFocusSub(null);
                          onUpdateItem(subIdx, item.id, patch);
                        }}
                        onRemove={() => onRemoveItem(subIdx, item.id)}
                        onDuplicate={() => onDuplicateItem(subIdx, item.id)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Footer adicionar item */}
            <div
              style={{
                padding: 12,
                background: 'hsl(var(--ds-line-2) / 0.2)',
                borderTop: '1px solid hsl(var(--ds-line-1))',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {phase.subcategories.map((sub, subIdx) => (
                <button
                  key={subIdx}
                  type="button"
                  onClick={() => handleAddItem(subIdx)}
                  style={{
                    width: '100%',
                    padding: '8px 0',
                    fontSize: 13,
                    color: 'hsl(var(--ds-fg-3))',
                    border: '1px dashed hsl(var(--ds-line-1))',
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'hsl(var(--ds-accent) / 0.05)';
                    e.currentTarget.style.color = 'hsl(var(--ds-fg-1))';
                    e.currentTarget.style.borderColor = 'hsl(var(--ds-accent) / 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'hsl(var(--ds-fg-3))';
                    e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
                  }}
                >
                  + Adicionar item{sub.name ? ` em ${sub.name}` : ''}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
