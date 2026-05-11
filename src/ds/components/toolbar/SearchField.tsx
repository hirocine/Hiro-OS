import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Larger placeholder size when the search is the primary control on the row. */
  width?: 'full' | 'narrow';
  ariaLabel?: string;
}

/**
 * Canonical search field — always Search icon prefix at left, shadcn Input.
 *
 * - `full` (default): flex:1, minWidth 200, expands within the parent row.
 * - `narrow`: minWidth 240, used when paired with inline dropdowns on a single line.
 *
 * Replaces 4 separate implementations across the codebase
 * (shadcn Input vs raw input vs Tailwind absolute positioning, etc).
 */
export function SearchField({
  value,
  onChange,
  placeholder = 'Buscar…',
  width = 'full',
  ariaLabel,
}: SearchFieldProps) {
  return (
    <div
      style={{
        position: 'relative',
        flex: width === 'full' ? 1 : '0 1 auto',
        minWidth: width === 'full' ? 200 : 240,
      }}
    >
      <Search
        size={14}
        strokeWidth={1.5}
        style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'hsl(var(--ds-fg-4))',
          pointerEvents: 'none',
        }}
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        style={{ paddingLeft: 34, width: '100%' }}
      />
    </div>
  );
}
