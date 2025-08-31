import { useEffect } from 'react';
import { useEquipment } from './useEquipment';

/**
 * Hook simplificado para equipamentos e projetos
 * A sincronização agora é feita automaticamente pelo banco de dados via triggers
 */
export function useEquipmentProjectSync() {
  const { allEquipment } = useEquipment();

  useEffect(() => {
    // A sincronização agora é automática via triggers no banco de dados
    // Este hook é mantido apenas para compatibilidade, mas não precisa fazer nada
    console.log('Equipment project sync: Automatic via database triggers');
  }, [allEquipment]);

  return {
    // Função para forçar sincronização (não necessária mais, mas mantida para compatibilidade)
    syncEquipmentStatus: () => {
      console.log('Equipment status sync: Handled automatically by database');
    }
  };
}