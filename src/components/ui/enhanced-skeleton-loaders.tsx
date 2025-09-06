import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Enhanced skeleton loaders with improved animations and realistic layouts
 */

export function EnhancedStatsCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted" />
            <Skeleton className="h-2 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted" />
          </div>
          <Skeleton className="h-5 w-5 rounded bg-gradient-to-r from-muted via-muted/50 to-muted" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-8 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted" />
          <Skeleton className="h-3 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted" />
        </div>
      </CardContent>
      
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </Card>
  );
}

export function EnhancedProjectCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-6 w-3/4 bg-gradient-to-r from-muted via-muted/50 to-muted" />
            <Skeleton className="h-4 w-1/2 bg-gradient-to-r from-muted via-muted/50 to-muted" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted" />
            <Skeleton className="h-8 w-8 rounded bg-gradient-to-r from-muted via-muted/50 to-muted" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted" />
              <Skeleton className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded bg-gradient-to-r from-muted via-muted/50 to-muted" />
            <Skeleton className="h-9 w-28 rounded bg-gradient-to-r from-muted via-muted/50 to-muted" />
          </div>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-9 rounded bg-gradient-to-r from-muted via-muted/50 to-muted" />
            ))}
          </div>
        </div>
      </CardContent>
      
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </Card>
  );
}

export function EnhancedEquipmentCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 bg-gradient-to-r from-muted via-muted/50 to-muted" />
              <Skeleton className="h-5 w-36 bg-gradient-to-r from-muted via-muted/50 to-muted" />
            </div>
            <Skeleton className="h-4 w-28 bg-gradient-to-r from-muted via-muted/50 to-muted" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-14 bg-gradient-to-r from-muted via-muted/50 to-muted" />
              <Skeleton className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded bg-gradient-to-r from-muted via-muted/50 to-muted" />
          ))}
        </div>
      </CardContent>
      
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </Card>
  );
}

export function EnhancedTableRowSkeleton() {
  return (
    <tr className="relative overflow-hidden">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 bg-gradient-to-r from-muted via-muted/50 to-muted" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted" />
            <Skeleton className="h-3 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted" />
          </div>
        </div>
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted" />
      </td>
      <td className="p-4">
        <Skeleton className="h-6 w-16 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted" />
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded bg-gradient-to-r from-muted via-muted/50 to-muted" />
          <Skeleton className="h-8 w-8 rounded bg-gradient-to-r from-muted via-muted/50 to-muted" />
        </div>
      </td>
      
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </tr>
  );
}

export function EnhancedFiltersSkeletonLoader() {
  return (
    <div className="relative overflow-hidden bg-card rounded-lg border p-4">
      <div className="flex flex-wrap gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2 min-w-[120px]">
            <Skeleton className="h-4 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted" />
            <Skeleton className="h-9 w-32 rounded bg-gradient-to-r from-muted via-muted/50 to-muted" />
          </div>
        ))}
      </div>
      
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-gradient-to-r from-muted via-muted/50 to-muted" />
        <Skeleton className="h-4 w-96 bg-gradient-to-r from-muted via-muted/50 to-muted" />
      </div>
      
      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <EnhancedStatsCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Content area skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EnhancedProjectCardSkeleton />
        </div>
        <div className="space-y-4">
          <EnhancedEquipmentCardSkeleton />
          <EnhancedEquipmentCardSkeleton />
        </div>
      </div>
    </div>
  );
}