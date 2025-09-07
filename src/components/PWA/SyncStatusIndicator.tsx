import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RotateCcw, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SyncStatusIndicator() {
  const { syncStatus, triggerSync } = useOfflineSync();

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Online/Offline Status */}
      <Badge 
        variant={syncStatus.isOnline ? "default" : "destructive"}
        className="flex items-center gap-1"
      >
        {syncStatus.isOnline ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        {syncStatus.isOnline ? 'Online' : 'Offline'}
      </Badge>

      {/* Sync Status */}
      {syncStatus.isSyncing && (
        <div className="flex items-center gap-2">
          <RotateCcw className="h-3 w-3 animate-spin" />
          <div className="w-20">
            <Progress value={syncStatus.syncProgress} className="h-1" />
          </div>
        </div>
      )}

      {/* Pending Operations */}
      {syncStatus.pendingOperations > 0 && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {syncStatus.pendingOperations} pendente{syncStatus.pendingOperations > 1 ? 's' : ''}
        </Badge>
      )}

      {/* Last Sync */}
      {syncStatus.lastSync && !syncStatus.isSyncing && (
        <Badge variant="outline" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-500" />
          {formatDistanceToNow(syncStatus.lastSync, {
            addSuffix: true,
            locale: ptBR
          })}
        </Badge>
      )}

      {/* Manual Sync Button */}
      {syncStatus.isOnline && !syncStatus.isSyncing && syncStatus.pendingOperations > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={triggerSync}
          className="h-6 px-2 text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Sincronizar
        </Button>
      )}
    </div>
  );
}