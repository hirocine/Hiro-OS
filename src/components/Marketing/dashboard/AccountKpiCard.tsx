import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  subtone?: 'muted' | 'positive' | 'negative';
}

export function AccountKpiCard({ icon: Icon, label, value, subtitle, subtone = 'muted' }: Props) {
  return (
    <Card className="shadow-card hover:shadow-elegant transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          {value}
        </div>
        {subtitle && (
          <p
            className={cn(
              'text-xs font-medium',
              subtone === 'positive' && 'text-success',
              subtone === 'negative' && 'text-destructive',
              subtone === 'muted' && 'text-muted-foreground'
            )}
          >
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
