import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { usePostProduction } from '@/features/post-production/hooks/usePostProduction';
import { PPVideoPage } from '@/features/post-production/components/PPVideoPage';
import { Skeleton } from '@/components/ui/skeleton';

export default function PPVideoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, isLoading } = usePostProduction();

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-48 col-span-2" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  const item = items.find(i => i.id === id);

  if (!item) {
    return <Navigate to="/esteira-de-pos" replace />;
  }

  return <PPVideoPage item={item} onBack={() => navigate(-1)} />;
}
