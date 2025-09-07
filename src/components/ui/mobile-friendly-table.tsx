import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileFriendlyTableProps {
  children: ReactNode;
  className?: string;
  minWidth?: string;
}

export function MobileFriendlyTable({ 
  children, 
  className,
  minWidth = '1200px'
}: MobileFriendlyTableProps) {
  const isMobile = useIsMobile();

  return (
    <Card className={cn('overflow-hidden shadow-card', className)}>
      <CardContent className="p-0">
        <div className="overflow-x-auto min-w-0">
          <div style={{ minWidth: isMobile ? minWidth : 'auto' }}>
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <div className={cn(
      'bg-muted/30 border-b border-border',
      className
    )}>
      {children}
    </div>
  );
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <div className={cn('bg-card', className)}>
      {children}
    </div>
  );
}