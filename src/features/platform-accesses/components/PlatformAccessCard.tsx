import { Star, ExternalLink, Copy, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PlatformAccess } from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { cn } from '@/lib/utils';

interface PlatformAccessCardProps {
  access: PlatformAccess;
  onEdit: (access: PlatformAccess) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopyPassword: (id: string) => void;
  onCopyUsername: (username: string) => void;
}

export function PlatformAccessCard({
  access,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopyPassword,
  onCopyUsername,
}: PlatformAccessCardProps) {
  const handleOpenUrl = () => {
    window.open(access.platform_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className={cn(
      "p-6 hover:shadow-lg transition-all duration-300",
      "border-2 hover:border-primary/50",
      !access.is_active && "opacity-60"
    )}>
      {/* Header com Favorite + Status + Category */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onToggleFavorite(access.id)}
          >
            <Star
              className={cn(
                "h-4 w-4",
                access.is_favorite
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              )}
            />
          </Button>
          <Badge variant={access.is_active ? "success" : "secondary"}>
            {access.is_active ? "Ativo" : "Inativo"}
          </Badge>
        </div>
        <Badge className={cn("text-xs", CATEGORY_COLORS[access.category])}>
          {CATEGORY_LABELS[access.category]}
        </Badge>
      </div>

      {/* Logo + Nome da Plataforma */}
      <div className="flex items-center gap-4 mb-4">
        {access.platform_icon_url ? (
          <div className="w-12 h-12 rounded-lg bg-background border flex items-center justify-center overflow-hidden">
            <img
              src={access.platform_icon_url}
              alt={access.platform_name}
              className="w-8 h-8 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-bold text-primary">
              {access.platform_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{access.platform_name}</h3>
        </div>
      </div>

      {/* Username com botão copiar */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs text-muted-foreground font-medium">
            Usuário/E-mail
          </label>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 text-sm bg-muted/50 px-3 py-2 rounded border truncate">
              {access.username}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => onCopyUsername(access.username)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Senha com botão copiar */}
        <div>
          <label className="text-xs text-muted-foreground font-medium">
            Senha
          </label>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 font-mono text-sm bg-muted/50 px-3 py-2 rounded border">
              ••••••••••••
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => onCopyPassword(access.id)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenUrl}
          className="flex-1"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(access)}
          className="flex-1"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDelete(access.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
