import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, children, compact }: EmptyStateProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 px-2 py-4 text-muted-foreground/60">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-sm">{description}</span>
        {action && (
          <Button variant="ghost" size="sm" onClick={action.onClick} className="ml-auto h-7 text-xs">
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground max-w-sm">{description}</p>
      </div>
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
