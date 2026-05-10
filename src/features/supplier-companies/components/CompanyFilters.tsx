import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CompanyFiltersProps {
  onSearchChange: (search: string) => void;
  onRatingChange: (rating: string) => void;
}

export function CompanyFilters({
  onSearchChange,
  onRatingChange,
}: CompanyFiltersProps) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
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
          placeholder="Buscar por nome…"
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ paddingLeft: 34 }}
        />
      </div>

      <Select onValueChange={onRatingChange}>
        <SelectTrigger style={{ width: 150 }}>
          <SelectValue placeholder="Todos ratings" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos ratings</SelectItem>
          <SelectItem value="5">5 estrelas</SelectItem>
          <SelectItem value="4">4+ estrelas</SelectItem>
          <SelectItem value="3">3+ estrelas</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
