import { useMemo } from 'react';
import { Film, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PostProductionItem } from '../types';

interface PPStatsCardsProps {
  items: PostProductionItem[];
}

export function PPStatsCards({ items }: PPStatsCardsProps) {
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const total = items.length;
    const inProgress = items.filter(i => ['edicao', 'color_grading', 'finalizacao'].includes(i.status)).length;
    const overdue = items.filter(i => {
      if (!i.due_date || i.status === 'entregue') return false;
      const due = new Date(i.due_date + 'T00:00:00');
      return due < today;
    }).length;

    const now = new Date();
    const delivered = items.filter(i => {
      if (i.status !== 'entregue') return false;
      const d = new Date(i.delivered_date || i.updated_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    return { total, inProgress, overdue, delivered };
  }, [items]);

  const cards = [
    { label: 'Total na Esteira', value: stats.total, icon: Film, color: 'text-primary' },
    { label: 'Em Produção', value: stats.inProgress, icon: Clock, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Atrasados', value: stats.overdue, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Entregues (mês)', value: stats.delivered, icon: CheckCircle2, color: 'text-green-600 dark:text-green-400' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(card => (
        <Card key={card.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <card.icon className={`h-5 w-5 ${card.color} shrink-0`} />
            <div className="min-w-0">
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground truncate">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
