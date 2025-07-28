import { useEffect } from 'react';
import { toast } from 'sonner';
import { useProjects } from './useProjects';
import { useEquipment } from './useEquipment';

export function useNotifications() {
  const { projects } = useProjects();
  const { equipment } = useEquipment();

  useEffect(() => {
    // Check for overdue projects
    const today = new Date().toISOString().split('T')[0];
    const overdueProjects = projects.filter(
      project => 
        project.status === 'active' && 
        project.expectedEndDate < today &&
        project.step !== 'verified'
    );

    if (overdueProjects.length > 0) {
      toast.warning(`${overdueProjects.length} projeto(s) em atraso`, {
        description: 'Verifique os projetos que passaram da data esperada de entrega.',
        duration: 5000,
      });
    }

    // Check for equipment needing maintenance (last maintenance > 6 months ago)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const equipmentNeedingMaintenance = equipment.filter(eq => {
      if (!eq.lastMaintenance) return false;
      const lastMaintenance = new Date(eq.lastMaintenance);
      return lastMaintenance < sixMonthsAgo && eq.status === 'available';
    });

    if (equipmentNeedingMaintenance.length > 0) {
      toast.info(`${equipmentNeedingMaintenance.length} equipamento(s) precisam de manutenção`, {
        description: 'Alguns equipamentos não recebem manutenção há mais de 6 meses.',
        duration: 5000,
      });
    }

    // Check for equipment with current loans for too long (> 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const equipmentInUseTooLong = equipment.filter(eq => {
      if (!eq.lastLoanDate || !eq.currentLoanId) return false;
      const lastLoanDate = new Date(eq.lastLoanDate);
      return lastLoanDate < thirtyDaysAgo;
    });

    if (equipmentInUseTooLong.length > 0) {
      toast.warning(`${equipmentInUseTooLong.length} equipamento(s) em uso há muito tempo`, {
        description: 'Alguns equipamentos estão em uso há mais de 30 dias.',
        duration: 5000,
      });
    }
  }, [projects, equipment]);

  return {
    // Notification helpers
    notifySuccess: (message: string, description?: string) => {
      toast.success(message, { description });
    },
    notifyError: (message: string, description?: string) => {
      toast.error(message, { description });
    },
    notifyWarning: (message: string, description?: string) => {
      toast.warning(message, { description });
    },
    notifyInfo: (message: string, description?: string) => {
      toast.info(message, { description });
    },
  };
}