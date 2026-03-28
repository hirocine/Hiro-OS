import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import type { TopEarner } from '@/features/rentals/types';

interface TopEarnersListProps {
  data: TopEarner[];
}

export function TopEarnersList({ data }: TopEarnersListProps) {
  const top5 = data.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warning" />
          Equipamentos Mais Rentáveis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {top5.map((item, index) => (
          <div key={item.equipmentId} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg font-bold text-muted-foreground w-6 text-center shrink-0">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{item.equipmentName}</p>
                <p className="text-xs text-muted-foreground">{item.category} · {item.totalRentals} locações</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-xs">
                ROI {item.roi}%
              </Badge>
              <span className="text-sm font-semibold text-success">
                R$ {item.totalRevenue.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
