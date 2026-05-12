import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Package } from 'lucide-react';
import { Equipment } from '@/types/equipment';
import { type LucideIcon } from 'lucide-react';
import { StatusPill } from '@/ds/components/StatusPill';

interface EquipmentSelectionStepProps {
  availableItems: Equipment[];
  selectedItems: Equipment[];
  onSelect: (item: Equipment) => void;
  onDeselect: (itemId: string) => void;
  icon: LucideIcon;
  availableTitle: string;
  selectedTitle: string;
  emptyAvailableText: string;
  emptySelectedText: string;
  loading: boolean;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  searchLabel?: string;
}

const eyebrowLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

export function EquipmentSelectionStep({
  availableItems,
  selectedItems,
  onSelect,
  onDeselect,
  icon: Icon,
  availableTitle,
  selectedTitle,
  emptyAvailableText,
  emptySelectedText,
  loading,
  searchTerm,
  onSearchChange,
  searchLabel,
}: EquipmentSelectionStepProps) {
  const filteredItems = searchTerm
    ? availableItems.filter((item) => {
        const lowerSearch = searchTerm.toLowerCase();
        return (
          item.name?.toLowerCase().includes(lowerSearch) ||
          item.brand?.toLowerCase().includes(lowerSearch)
        );
      })
    : availableItems;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1, overflowY: 'auto' }} className="animate-fade-in">
      {/* Search Input (optional) */}
      {onSearchChange && searchLabel && (
        <div>
          <label htmlFor="search-equipment" style={eyebrowLabel}>{searchLabel}</label>
          <Input
            id="search-equipment"
            placeholder="Digite nome ou marca..."
            value={searchTerm || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-md"
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }} className="lg:[grid-template-columns:1fr_1fr]">
        {/* Available Items */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginBottom: 16 }}>
            <Icon size={18} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-2))' }} />
            <h4 style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 14,
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-1))',
            }}>
              {availableTitle}
            </h4>
            <span className="pill muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {filteredItems.length} disponíveis
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{
                  height: 96,
                  background: 'hsl(var(--ds-line-2) / 0.3)',
                }} className="animate-pulse" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ height: 500, overflowY: 'auto', flex: 1 }}>
              <div style={{
                border: '1px dashed hsl(var(--ds-line-1))',
                background: 'hsl(var(--ds-surface))',
                padding: '24px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 120,
              }}>
                <div style={{ textAlign: 'center', fontSize: 13, color: 'hsl(var(--ds-fg-3))', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Icon size={28} strokeWidth={1.5} style={{ margin: '0 auto', opacity: 0.5, color: 'hsl(var(--ds-fg-3))' }} />
                  <p style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-2))' }}>{emptyAvailableText}</p>
                  <p style={{ fontSize: 11 }}>Todos os itens estão em uso ou seu filtro não encontrou resultados</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ height: 500, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredItems.map((item) => {
                const isSelected = selectedItems.some((s) => s.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => !isSelected && onSelect(item)}
                    style={{
                      border: isSelected
                        ? '1px solid hsl(var(--ds-success) / 0.5)'
                        : '1px solid hsl(var(--ds-line-1))',
                      background: isSelected
                        ? 'hsl(var(--ds-success) / 0.08)'
                        : 'hsl(var(--ds-surface))',
                      cursor: isSelected ? 'default' : 'pointer',
                      height: 96,
                      padding: 16,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'hsl(var(--ds-line-3))';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: isSelected
                            ? '1px solid hsl(var(--ds-success) / 0.3)'
                            : '1px solid hsl(var(--ds-line-1))',
                          background: isSelected
                            ? 'hsl(var(--ds-success) / 0.1)'
                            : 'hsl(var(--ds-line-2) / 0.3)',
                        }}
                      >
                        {isSelected ? (
                          <Check size={22} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-success))' }} />
                        ) : item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Icon size={22} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
                          <div style={{ flex: 1, minWidth: 0, marginRight: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p style={{
                                  fontWeight: 500,
                                  fontSize: 13,
                                  color: 'hsl(var(--ds-fg-1))',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {item.name}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{item.name}</p>
                              </TooltipContent>
                            </Tooltip>
                            <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
                              {item.brand}
                            </p>
                          </div>
                          <button
                            type="button"
                            className={isSelected ? 'btn' : 'btn'}
                            disabled={isSelected}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isSelected) onSelect(item);
                            }}
                            style={isSelected ? {
                              height: 28,
                              fontSize: 12,
                              color: 'hsl(var(--ds-success))',
                              borderColor: 'hsl(var(--ds-success) / 0.3)',
                              background: 'hsl(var(--ds-success) / 0.08)',
                            } : { height: 28, fontSize: 12 }}
                          >
                            {isSelected ? (
                              <>
                                <Check size={11} strokeWidth={1.5} />
                                <span>Selecionado</span>
                              </>
                            ) : (
                              'Selecionar'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Items */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginBottom: 16 }}>
            <Check size={18} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-success))' }} />
            <h4 style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 14,
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-1))',
            }}>
              {selectedTitle}
            </h4>
            <StatusPill label={String(selectedItems.length)} tone="accent" />
          </div>

          {selectedItems.length === 0 ? (
            <div style={{ height: 500, overflowY: 'auto', flex: 1 }}>
              <div style={{
                border: '1px dashed hsl(var(--ds-line-1))',
                background: 'hsl(var(--ds-surface))',
                padding: '24px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 120,
              }}>
                <div style={{ textAlign: 'center', fontSize: 13, color: 'hsl(var(--ds-fg-3))', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Package size={28} strokeWidth={1.5} style={{ margin: '0 auto', opacity: 0.5, color: 'hsl(var(--ds-fg-3))' }} />
                  <p style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-2))' }}>{emptySelectedText}</p>
                  <p style={{ fontSize: 11 }}>Clique nos itens disponíveis para adicioná-los</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ height: 500, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="animate-fade-in"
                  style={{
                    border: '1px solid hsl(var(--ds-accent) / 0.3)',
                    background: 'hsl(var(--ds-accent) / 0.05)',
                    height: 96,
                    padding: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid hsl(var(--ds-success) / 0.3)',
                      background: 'hsl(var(--ds-success) / 0.1)',
                    }}>
                      <Check size={22} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-success))' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
                        <div style={{ flex: 1, minWidth: 0, marginRight: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <p style={{
                            fontWeight: 500,
                            fontSize: 13,
                            color: 'hsl(var(--ds-fg-1))',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {item.name}
                          </p>
                          <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
                            {item.brand}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            height: 28,
                            fontSize: 12,
                            color: 'hsl(var(--ds-danger))',
                            borderColor: 'hsl(var(--ds-danger) / 0.3)',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeselect(item.id);
                          }}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
