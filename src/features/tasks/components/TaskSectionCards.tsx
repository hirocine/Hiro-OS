import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Lock, ArrowRight, ListChecks, AlertTriangle, Flame } from 'lucide-react';
import { useTaskSectionStats } from '../hooks/useTaskSectionStats';

interface StatItemProps {
  value: number;
  label: string;
  colorClass?: string;
}

function StatItem({ value, label, colorClass = 'text-muted-foreground' }: StatItemProps) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export function TaskSectionCards() {
  const { team, private: privateStats, isLoading } = useTaskSectionStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-10 w-10 rounded-xl mb-4" />
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-9 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const sections = [
    {
      id: 'team',
      label: 'Tarefas de Time',
      icon: Users,
      to: '/tarefas/todas',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      hoverTextColor: 'hover:text-primary',
      buttonVariant: 'default' as const,
      stats: team,
    },
    {
      id: 'private',
      label: 'Tarefas Privadas',
      icon: Lock,
      to: '/tarefas/privadas',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
      hoverTextColor: 'hover:text-purple-500',
      buttonVariant: 'outline' as const,
      buttonClass: 'border-purple-500/50 text-purple-600 hover:bg-purple-500/10',
      stats: privateStats,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map((section) => (
        <Card 
          key={section.id} 
          className="overflow-hidden hover:shadow-lg transition-shadow"
        >
          <CardContent className="p-6">
            {/* Header with icon, title and navigation button */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${section.iconBg}`}>
                  <section.icon className={`h-6 w-6 ${section.iconColor}`} />
                </div>
                <h3 className="font-semibold text-lg">{section.label}</h3>
              </div>
              
              <Link to={section.to}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`${section.iconColor} ${section.hoverTextColor} hover:bg-muted`}
                >
                  Ver todas
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mini stats grid */}
            <div className="grid grid-cols-3 gap-4 py-4 px-2 bg-muted/30 rounded-lg">
              <div className="flex flex-col items-center gap-1">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                <StatItem value={section.stats.active} label="Ativas" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <StatItem 
                  value={section.stats.overdue} 
                  label="Atrasadas" 
                  colorClass={section.stats.overdue > 0 ? 'text-destructive' : 'text-muted-foreground'}
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <StatItem 
                  value={section.stats.urgent} 
                  label="Urgentes" 
                  colorClass={section.stats.urgent > 0 ? 'text-orange-500' : 'text-muted-foreground'}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
