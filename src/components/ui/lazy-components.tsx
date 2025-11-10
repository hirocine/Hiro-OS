import { lazy } from 'react';
import { DashboardSkeleton } from './enhanced-skeleton-loaders';

/**
 * Lazy loaded components for better performance
 */

// Heavy dashboard components
export const LazyProjectTimeline = lazy(() => 
  import('@/components/Projects/ProjectTimeline').then(module => ({ 
    default: module.ProjectTimeline 
  }))
);

// Equipment heavy components
export const LazyBulkImageUploadDialog = lazy(() => 
  import('@/components/Equipment/BulkImageUploadDialog').then(module => ({ 
    default: module.BulkImageUploadDialog 
  }))
);

export const LazyImportDialog = lazy(() => 
  import('@/components/Equipment/ImportDialog').then(module => ({ 
    default: module.ImportDialog 
  }))
);

// Charts and analytics
export const LazyChart = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.ResponsiveContainer 
  }))
);

/**
 * Common fallback components for lazy loading
 */
export const ChartSkeleton = () => (
  <div className="h-[300px] bg-card rounded-lg border flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground">
      Carregando gráfico...
    </div>
  </div>
);

export const DialogSkeleton = () => (
  <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
    <div className="bg-card border rounded-lg p-6 max-w-md w-full mx-4">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-muted rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <div className="h-9 bg-muted rounded w-20"></div>
          <div className="h-9 bg-muted rounded w-24"></div>
        </div>
      </div>
    </div>
  </div>
);

export { DashboardSkeleton };