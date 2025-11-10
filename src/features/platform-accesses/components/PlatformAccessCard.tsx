import { useState } from 'react';
import { Star, ExternalLink, Copy, Pencil, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PlatformAccess } from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { cn } from '@/lib/utils';

interface PlatformAccessCardProps {
  access: PlatformAccess;
  onEdit: (access: PlatformAccess) => void;
  onToggleFavorite: (id: string) => void;
  onCopyPassword: (id: string) => void;
  onCopyUsername: (username: string) => void;
  onGetPassword: (id: string) => Promise<string | null>;
}

export function PlatformAccessCard({
  access,
  onEdit,
  onToggleFavorite,
  onCopyPassword,
  onCopyUsername,
  onGetPassword,
}: PlatformAccessCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState<string>('');
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  const handleOpenUrl = () => {
    window.open(access.platform_url, '_blank', 'noopener,noreferrer');
  };

  const handleTogglePasswordVisibility = async () => {
    if (!showPassword && !decryptedPassword) {
      setIsLoadingPassword(true);
      const password = await onGetPassword(access.id);
      setIsLoadingPassword(false);
      
      if (password) {
        setDecryptedPassword(password);
        setShowPassword(true);
      }
    } else {
      setShowPassword(!showPassword);
    }
  };

  return (
    <Card className={cn(
      "p-6 hover:shadow-lg transition-all duration-300",
      "flex flex-col min-h-[380px]",
      access.is_active 
        ? "border-2 hover:border-primary/50" 
        : "border-2 border-red-500/50 bg-red-500/5 hover:border-red-500/70"
    )}>
      {/* Header com Favorite + Category + Status */}
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
          <Badge className={cn("text-xs", CATEGORY_COLORS[access.category])}>
            {CATEGORY_LABELS[access.category]}
          </Badge>
        </div>
        <Badge variant={access.is_active ? "success" : "destructive"}>
          {access.is_active ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      {/* Logo + Nome da Plataforma */}
      <div className="flex items-start gap-4 mb-4">
        {access.platform_icon_url ? (
          <div className={cn(
            "w-12 h-12 rounded-lg bg-background flex items-center justify-center overflow-hidden",
            access.is_active ? "border" : "border-2 border-red-500"
          )}>
            <img
              src={access.platform_icon_url}
              alt={access.platform_name}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            access.is_active 
              ? "bg-primary/10" 
              : "bg-red-500/10 border-2 border-red-500"
          )}>
            <span className={cn(
              "text-xl font-bold",
              access.is_active ? "text-primary" : "text-red-500"
            )}>
              {access.platform_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{access.platform_name}</h3>
        </div>
      </div>

      {/* Spacer - empurra credenciais para o bottom */}
      <div className="flex-grow" />

      {/* Credenciais - Lógica condicional por categoria */}
      <div className="space-y-3 mb-4">
        {access.category === 'software' ? (
          // MODO SOFTWARE: Mostrar apenas KEY
          <>
            {/* Username (opcional para software) */}
            {access.username && (
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
            )}

            {/* License Key */}
            <div>
              <label className="text-xs text-muted-foreground font-medium">
                License Key
              </label>
            <div className="flex items-center gap-2 mt-1">
              <div className="relative flex-1 min-w-0">
                <div className="font-mono text-sm bg-muted/50 px-3 py-2 pr-10 rounded border overflow-hidden text-ellipsis whitespace-nowrap">
                  {showPassword && decryptedPassword ? decryptedPassword : '••••••••••••'}
                </div>
                <button
                  onClick={handleTogglePasswordVisibility}
                  disabled={isLoadingPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded transition-colors disabled:opacity-50"
                >
                  {isLoadingPassword ? (
                    <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
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
          </>
        ) : (
          // MODO PADRÃO: Username + Password
          <>
            {/* Username */}
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

            {/* Senha */}
            <div>
              <label className="text-xs text-muted-foreground font-medium">
                Senha
              </label>
            <div className="flex items-center gap-2 mt-1">
              <div className="relative flex-1 min-w-0">
                <div className="font-mono text-sm bg-muted/50 px-3 py-2 pr-10 rounded border overflow-hidden text-ellipsis whitespace-nowrap">
                  {showPassword && decryptedPassword ? decryptedPassword : '••••••••••••'}
                </div>
                <button
                  onClick={handleTogglePasswordVisibility}
                  disabled={isLoadingPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded transition-colors disabled:opacity-50"
                >
                  {isLoadingPassword ? (
                    <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
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
          </>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-2 mt-auto">
        {access.platform_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenUrl}
            className={cn(
              "flex-1",
              !access.is_active && "border-red-500/50 text-red-600 hover:bg-red-500/10"
            )}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Link
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(access)}
          className={cn(
            "flex-1",
            !access.is_active && "border-red-500/50 text-red-600 hover:bg-red-500/10"
          )}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>
    </Card>
  );
}
