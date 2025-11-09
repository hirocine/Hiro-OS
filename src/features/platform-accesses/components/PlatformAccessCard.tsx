import { useState } from 'react';
import { Star, ExternalLink, Copy, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { PlatformAccess } from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { cn } from '@/lib/utils';

interface PlatformAccessCardProps {
  access: PlatformAccess;
  onEdit: (access: PlatformAccess) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopyPassword: (id: string) => void;
}

export function PlatformAccessCard({
  access,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopyPassword,
}: PlatformAccessCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleOpenUrl = () => {
    window.open(access.platform_url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyPassword = async () => {
    await onCopyPassword(access.id);
    setShowPassword(false);
  };

  return (
    <div className="perspective-1000 h-[280px]">
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 transform-style-3d",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Front Face */}
        <Card
          className={cn(
            "absolute inset-0 backface-hidden cursor-pointer",
            "bg-gradient-to-br from-background to-muted/20",
            "border-2 hover:border-primary/50 transition-all duration-300",
            "hover:shadow-lg hover:-translate-y-1",
            "flex flex-col p-6"
          )}
          onClick={() => setIsFlipped(true)}
        >
          {/* Header with favorite */}
          <div className="flex justify-between items-start mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -ml-2 -mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(access.id);
              }}
            >
              <Star
                className={cn(
                  "h-5 w-5",
                  access.is_favorite
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                )}
              />
            </Button>
            <Badge className={cn("text-xs", CATEGORY_COLORS[access.category])}>
              {CATEGORY_LABELS[access.category]}
            </Badge>
          </div>

          {/* Icon and Platform Name */}
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            {access.platform_icon_url ? (
              <div className="relative w-20 h-20 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center overflow-hidden shadow-md">
                <img
                  src={access.platform_icon_url}
                  alt={access.platform_name}
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <span className="text-3xl font-bold text-primary">
                  {access.platform_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-lg">{access.platform_name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{access.username}</p>
            </div>
          </div>

          {/* Creator info */}
          {access.creator_name && (
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Criado por {access.creator_name}
            </div>
          )}

          {/* Click hint */}
          <div className="text-xs text-center text-muted-foreground mt-2 opacity-50">
            Clique para ver a senha
          </div>
        </Card>

        {/* Back Face */}
        <Card
          className={cn(
            "absolute inset-0 backface-hidden rotate-y-180",
            "bg-gradient-to-br from-background to-muted/20",
            "border-2 border-primary/50",
            "flex flex-col p-6"
          )}
          onClick={() => setIsFlipped(false)}
        >
          <div className="flex-1 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Senha</label>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 font-mono text-sm bg-muted/50 px-3 py-2 rounded border">
                  {showPassword ? '••••••••••••' : '••••••••••••'}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPassword(!showPassword);
                  }}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {access.notes && (
              <div>
                <label className="text-xs text-muted-foreground">Notas</label>
                <p className="text-sm mt-1 text-foreground/80">{access.notes}</p>
              </div>
            )}

            <div className="flex-1" />

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyPassword();
                }}
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Senha
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenUrl();
                }}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(access);
                }}
                className="w-full"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(access.id);
                }}
                className="w-full text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </Button>
            </div>
          </div>

          {/* Click hint */}
          <div className="text-xs text-center text-muted-foreground mt-4 opacity-50">
            Clique para voltar
          </div>
        </Card>
      </div>
    </div>
  );
}
