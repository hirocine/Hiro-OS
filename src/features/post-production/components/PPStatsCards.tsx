import { useMemo } from 'react';
import { Film, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@/components/ui/stats-card';
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
    { title: 'Total na Esteira', value: stats.total, icon: Film, color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-l-primary' },
    { title: 'Em Produção', value: stats.inProgress, icon: Clock, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-l-blue-500' },
    { title: 'Atrasados', value: stats.overdue, icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10', borderColor: 'border-l-destructive' },
    { title: 'Entregues (mês)', value: stats.delivered, icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-l-green-500' },
  ];

  return (
    <StatsCardGrid columns={4}>
      {cards.map(card => (
        <StatsCard key={card.title} {...card} />
      ))}
    </StatsCardGrid>
  );
}
