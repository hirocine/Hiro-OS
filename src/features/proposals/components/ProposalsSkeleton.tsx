import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, CheckCircle, Archive, ChevronRight } from 'lucide-react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';

function ProposalCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header: Avatar + text */}
        <div className="flex items-start gap-3 mb-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-1.5 mb-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>

        {/* Info rows */}
        <div className="space-y-1.5 mb-3">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-3.5 w-3/5" />
        </div>

        {/* Action button */}
        <Skeleton className="h-8 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

export function ProposalsPageSkeleton() {
  return (
    <ResponsiveContainer maxWidth="7xl">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      <div className="space-y-6">
        {/* Active section */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <Skeleton className="h-5 w-40" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProposalCardSkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Approved collapsed */}
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <Skeleton className="h-5 w-28" />
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
        </Card>

        {/* Archived collapsed */}
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-muted">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                </div>
                <Skeleton className="h-5 w-28" />
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
        </Card>
      </div>
    </ResponsiveContainer>
  );
}
