import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface PageHeaderProps {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  subtitle, 
  actions, 
  className 
}: PageHeaderProps) {
  const { isMobile, getContainerPadding } = useResponsiveLayout();

  return (
    <div className={cn(
      "flex flex-col gap-4 md:gap-6 mb-6 md:mb-8",
      className
    )}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className={cn(
            "font-bold tracking-tight text-foreground text-left",
            isMobile ? "text-xl" : "text-2xl md:text-3xl"
          )}>
            {title}
          </h1>
          {subtitle && (
            <div className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {typeof subtitle === 'string' ? subtitle : subtitle}
            </div>
          )}
        </div>
        
        {actions && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}