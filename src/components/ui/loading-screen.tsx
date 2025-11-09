import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({ message = 'Carregando...', className }: LoadingScreenProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-screen bg-background",
      className
    )}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Skeleton version for smoother loading
export function LoadingScreenSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <div className="space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="h-12 bg-muted rounded-lg w-1/3" />
        
        {/* Content skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
