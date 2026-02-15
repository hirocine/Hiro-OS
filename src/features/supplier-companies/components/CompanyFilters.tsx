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
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select onValueChange={onRatingChange}>
        <SelectTrigger className="w-full md:w-[150px]">
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
