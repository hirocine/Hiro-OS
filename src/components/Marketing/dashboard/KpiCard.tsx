import { Card, CardContent } from '@/components/ui/card';
import { ChangeBadge } from './ChangeBadge';

interface Props {
  label: string;
  value: string | number;
  change: number | null;
  emoji: string;
}

export function KpiCard({ label, value, change, emoji }: Props) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <span>{emoji}</span>
          <span>{label}</span>
        </div>
        <div className="text-3xl font-semibold mt-2">{value}</div>
        <div className="mt-1">
          <ChangeBadge value={change} />
        </div>
      </CardContent>
    </Card>
  );
}
