import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  description?: string;
}

export function StatsCard({ title, value, icon: Icon, color, bgColor, borderColor, description }: StatsCardProps) {
  return (
    <Card className={`border-l-4 ${borderColor} ${bgColor.replace('/10', '/5')} hover:shadow-elegant transition-all duration-300 animate-fade-in`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground truncate">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export function StatsCardGrid({ children, columns = 3 }: StatsCardGridProps) {
  const colClass = columns === 2
    ? 'grid-cols-1 sm:grid-cols-2'
    : columns === 4
      ? 'grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-1 sm:grid-cols-3';

  return <div className={`grid ${colClass} gap-4`}>{children}</div>;
}
