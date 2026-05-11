interface FilterIndicatorProps {
  /** Number of items shown after filtering. */
  count: number;
  /** Total number of items before filtering. */
  total: number;
  /** Noun used in the indicator (e.g. "tarefas", "vídeos", "equipamentos"). */
  noun: string;
  /** Single clear-all callback. Resets search + dropdowns + chips. */
  onClear: () => void;
  /** If false the indicator does not render (use when no filters are active). */
  active: boolean;
}

/**
 * Canonical "active filters" indicator + single clear-all (slot 05).
 *
 * Renders only when `active` is true. Replaces:
 *   - Tasks' inline "Filtros ativos · mostrando X de Y" + "Limpar filtros"
 *   - UnifiedEquipmentFilters' `.btn` with RotateCcw icon
 *   - ProjectFilters' small `<X>` button
 *
 * Position rule (PageToolbar): linha 05, full width. Indicator left, clear right.
 */
export function FilterIndicator({ count, total, noun, onClear, active }: FilterIndicatorProps) {
  if (!active) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 12,
        fontSize: 12,
        color: 'hsl(var(--ds-fg-3))',
      }}
    >
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        Filtros ativos · mostrando{' '}
        <strong style={{ color: 'hsl(var(--ds-fg-1))', fontWeight: 500 }}>{count}</strong>{' '}
        de {total} {noun}
      </span>
      <button
        type="button"
        onClick={onClear}
        style={{
          fontFamily: '"HN Display", sans-serif',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'hsl(var(--ds-fg-3))',
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          padding: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'hsl(var(--ds-fg-1))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'hsl(var(--ds-fg-3))';
        }}
      >
        Limpar tudo
      </button>
    </div>
  );
}
