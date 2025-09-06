import { useEffect } from 'react';
import { useEquipment } from './useEquipment';
import { logger } from '@/lib/logger';

/**
 * Hook simplificado para equipamentos e projetos
 * A sincronização agora é feita automaticamente pelo banco de dados via triggers
 */
export function useEquipmentProjectSync() {
  const { allEquipment } = useEquipment();

  useEffect(() => {
    // A sincronização agora é automática via triggers no banco de dados
    // Este hook é mantido apenas para compatibilidade, mas não precisa fazer nada
    logger.debug('Equipment project sync: Automatic via database triggers', {
      module: 'equipment-project-sync',
      action: 'sync_check',
      data: { equipmentCount: allEquipment.length }
    });
  }, [allEquipment]);

  return {
    // Função para forçar sincronização (não necessária mais, mas mantida para compatibilidade)
    syncEquipmentStatus: () => {
      logger.debug('Equipment status sync: Handled automatically by database', {
        module: 'equipment-project-sync',
        action: 'force_sync'
      });
    }
  };
}