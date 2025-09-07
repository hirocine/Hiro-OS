import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';

interface MobileFriendlyTableProps {
  children: ReactNode;
  className?: string;
  minWidth?: string;
  isLoading?: boolean;
}

export function MobileFriendlyTable({ 
  children, 
  className,
  minWidth = '1200px',
  isLoading = false
}: MobileFriendlyTableProps) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <Card className={cn('overflow-hidden shadow-card', className)}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
                <Skeleton className="h-8 w-[100px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden shadow-card animate-fade-in', className)}>
      <CardContent className="p-0">
        <div className="overflow-x-auto min-w-0">
          <div style={{ minWidth: isMobile ? 'auto' : minWidth }} className="min-w-0">
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
  sticky?: boolean;
}

export function TableHeader({ children, className, sticky = false }: TableHeaderProps) {
  return (
    <div className={cn(
      'bg-muted/30 border-b border-border backdrop-blur-sm',
      sticky && 'sticky top-0 z-10',
      className
    )}>
      {children}
    </div>
  );
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
  emptyState?: ReactNode;
  isEmpty?: boolean;
}

export function TableBody({ children, className, emptyState, isEmpty = false }: TableBodyProps) {
  if (isEmpty && emptyState) {
    return (
      <div className={cn('bg-card min-h-[200px] flex items-center justify-center', className)}>
        {emptyState}
      </div>
    );
  }

  return (
    <div className={cn('bg-card', className)}>
      {children}
    </div>
  );
}