import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: number | null;
  withContext?: boolean;
}

export function ChangeBadge({ value, withContext = true }: Props) {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        Sem comparação ainda
      </span>
    );
  }
  const positive = value >= 0;
  const Icon = positive ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        positive ? 'text-emerald-500' : 'text-red-500'
      )}
    >
      <Icon className="h-3 w-3" />
      <span className="font-numeric">{Math.abs(value).toFixed(1)}%</span>
      {withContext && (
        <span className="text-muted-foreground font-normal ml-0.5">vs período anterior</span>
      )}
    </span>
  );
}
