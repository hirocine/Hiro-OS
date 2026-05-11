import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

interface FilterDropdownProps {
  /** Filter name shown inside the trigger (e.g. "Prioridade"). REQUIRED. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  /** Width scale — sm 140 / md 180 / lg 220. */
  width?: 'sm' | 'md' | 'lg';
  /** Value treated as "no filter" (default: 'all'). */
  allValue?: string;
  /** Label for the "all" option in the dropdown menu (default: "Todos"). */
  allOptionLabel?: string;
}

const WIDTHS = { sm: 140, md: 180, lg: 220 } as const;

/**
 * Canonical filter dropdown.
 *
 * Trigger always shows the filter name. When a value is selected, it shows
 * `Label: <selected>`. This keeps the dropdown self-documenting even when
 * nothing is selected — no more rows of identical-looking "Todos / Todas".
 *
 *   Inactive: [ Prioridade ▾ ]
 *   Active:   [ Prioridade: Urgente ▾ ]
 *
 * Position rule (PageToolbar): inside `filters`, after `<SearchField>`.
 */
export function FilterDropdown({
  label,
  value,
  onChange,
  options,
  width = 'md',
  allValue = 'all',
  allOptionLabel = 'Todos',
}: FilterDropdownProps) {
  const selected = options.find((o) => o.value === value);
  const isActive = value !== allValue && !!selected;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        style={{
          width: WIDTHS[width],
          height: 34,
          /* Subtle accent ring when a non-default value is selected */
          borderColor: isActive ? 'hsl(var(--ds-accent) / 0.45)' : undefined,
        }}
        aria-label={label}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'left',
            color: 'hsl(var(--ds-fg-2))',
          }}
        >
          {isActive ? (
            <>
              {label}:{' '}
              <span style={{ color: 'hsl(var(--ds-fg-1))', fontWeight: 500 }}>
                {selected!.label}
              </span>
            </>
          ) : (
            label
          )}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={allValue}>{allOptionLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
