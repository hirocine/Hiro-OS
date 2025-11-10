import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CompanyPolicy } from '../types';

interface PolicyCardProps {
  policy: CompanyPolicy;
}

export function PolicyCard({ policy }: PolicyCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/politicas/${policy.id}`);
  };

  return (
    <Card
      onClick={handleClick}
      className={cn(
        "flex flex-col items-center justify-center p-8 cursor-pointer",
        "hover:shadow-lg hover:scale-105 transition-all duration-200",
        "min-h-[200px] space-y-4"
      )}
    >
      <div className="text-6xl">
        {policy.icon_url || '📋'}
      </div>
      
      <h3 className="text-lg font-semibold text-center line-clamp-2">
        {policy.title}
      </h3>
    </Card>
  );
}
