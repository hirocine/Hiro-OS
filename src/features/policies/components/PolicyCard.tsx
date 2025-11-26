import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CompanyPolicy } from '../types';
import { CATEGORY_COLORS } from '../types';

interface PolicyCardProps {
  policy: CompanyPolicy;
}

export function PolicyCard({ policy }: PolicyCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/politicas/${policy.id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const categoryColorClass = CATEGORY_COLORS[policy.category || 'Geral'] || '';

  return (
    <Card
      onClick={handleClick}
      className={cn(
        "group relative overflow-hidden cursor-pointer",
        "p-6 flex flex-col min-h-[200px]",
        "hover:shadow-lg transition-all duration-300",
        "animate-fade-in"
      )}
    >
      {/* Header: Categoria Badge */}
      {policy.category && (
        <div className="flex justify-between items-start mb-4">
          <Badge variant="secondary" className="text-xs">
            {policy.category}
          </Badge>
        </div>
      )}

      {/* Ícone + Título (layout horizontal) */}
      <div className="flex items-start gap-4 mb-4">
        <div 
          className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
            "bg-primary/10 transition-transform duration-300 group-hover:scale-110"
          )}
        >
          <span className="text-2xl">
            {policy.icon_url || '📋'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
            {policy.title}
          </h3>
        </div>
      </div>

      {/* Spacer para empurrar footer para baixo */}
      <div className="flex-grow" />

      {/* Footer: Data de atualização */}
      {policy.updated_at && (
        <p className="text-xs text-muted-foreground mt-4">
          Atualizado em {formatDate(policy.updated_at)}
        </p>
      )}
    </Card>
  );
}
