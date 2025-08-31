import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipment, EquipmentCategory } from '@/types/equipment';
import { Loan } from '@/types/loan';

interface ProjectEquipment extends Equipment {
  loanInfo: {
    loanId: string;
    borrowerName: string;
    loanDate: string;
    expectedReturnDate: string;
    status: Loan['status'];
  };
}

export function useProjectEquipment(projectId: string) {
  const [equipment, setEquipment] = useState<ProjectEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectEquipment = async () => {
    try {
      setLoading(true);
      
      // Primeiro, buscar o projeto para obter o nome
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      
      // Buscar empréstimos ativos/em atraso do projeto (por nome ou ID)
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .or(`project.eq.${project.name},project.eq.${projectId}`)
        .in('status', ['active', 'overdue']);

      if (loansError) throw loansError;

      if (!loans || loans.length === 0) {
        setEquipment([]);
        return;
      }

      // Buscar equipamentos correspondentes
      const equipmentIds = loans.map(loan => loan.equipment_id);
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipments')
        .select('*')
        .in('id', equipmentIds);

      if (equipmentError) throw equipmentError;

      // Combinar dados de equipamentos com informações do empréstimo
      const projectEquipment: ProjectEquipment[] = (equipmentData || []).map(eq => {
        const loan = loans.find(l => l.equipment_id === eq.id);
        return {
          id: eq.id,
          name: eq.name,
          brand: eq.brand,
          category: eq.category as EquipmentCategory,
          subcategory: eq.subcategory,
          customCategory: eq.custom_category,
          status: eq.status as Equipment['status'],
          itemType: eq.item_type as Equipment['itemType'],
          parentId: eq.parent_id,
          hasAccessories: false,
          serialNumber: eq.serial_number,
          purchaseDate: eq.purchase_date,
          lastMaintenance: eq.last_maintenance,
          description: eq.description,
          image: eq.image,
          value: eq.value,
          patrimonyNumber: eq.patrimony_number,
          depreciatedValue: eq.depreciated_value,
          receiveDate: eq.receive_date,
          store: eq.store,
          invoice: eq.invoice,
          currentLoanId: eq.current_loan_id,
          currentBorrower: eq.current_borrower,
          lastLoanDate: eq.last_loan_date,
          loanInfo: {
            loanId: loan!.id,
            borrowerName: loan!.borrower_name,
            loanDate: loan!.loan_date,
            expectedReturnDate: loan!.expected_return_date,
            status: loan!.status as Loan['status']
          }
        };
      });

      setEquipment(projectEquipment);
    } catch (err) {
      console.error('Error fetching project equipment:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar equipamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectEquipment();
    }
  }, [projectId]);

  return { equipment, loading, error, refetch: fetchProjectEquipment };
}