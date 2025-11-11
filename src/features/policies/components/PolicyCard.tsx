import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
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

  const borderColor = CATEGORY_COLORS[policy.category || 'Geral'] || 'border-t-primary';

  return (
    <Card
      onClick={handleClick}
      className={cn(
        "group relative overflow-hidden cursor-pointer min-h-[240px]",
        "hover:shadow-elegant hover:scale-[1.02] hover:-translate-y-1",
        "transition-all duration-300 animate-fade-in",
        "border-t-4",
        borderColor,
        "bg-gradient-to-br from-background to-muted/20"
      )}
    >
      <CardHeader className="text-center space-y-4 pb-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 ring-4 ring-primary/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <span className="text-5xl">
            {policy.icon_url || '📋'}
          </span>
        </div>
        {policy.category && (
          <Badge variant="secondary" className="text-xs">
            {policy.category}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="text-center pb-8 space-y-3">
        <h3 className="text-lg font-semibold line-clamp-2 min-h-[3.5rem] px-2">
          {policy.title}
        </h3>
        
        {policy.updated_at && (
          <p className="text-xs text-muted-foreground">
            Atualizado em {formatDate(policy.updated_at)}
          </p>
        )}
      </CardContent>
      
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Card>
  );
}
