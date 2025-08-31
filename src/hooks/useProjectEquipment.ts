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
      
      // Usar a função RPC segura para buscar equipamentos do projeto
      const { data: projectEquipmentData, error } = await supabase
        .rpc('get_project_equipment', { _project_id: projectId });

      if (error) {
        console.error('Error fetching project equipment:', error);
        throw error;
      }

      if (!projectEquipmentData || projectEquipmentData.length === 0) {
        setEquipment([]);
        return;
      }

      // Transformar os dados para o formato esperado
      const projectEquipment: ProjectEquipment[] = projectEquipmentData.map(data => ({
        id: data.equipment_id,
        name: data.equipment_name,
        brand: data.equipment_brand,
        category: data.equipment_category as EquipmentCategory,
        subcategory: data.equipment_subcategory,
        customCategory: data.equipment_custom_category,
        status: data.equipment_status as Equipment['status'],
        itemType: data.equipment_item_type as Equipment['itemType'],
        parentId: data.equipment_parent_id,
        hasAccessories: false,
        isExpanded: false,
        serialNumber: data.equipment_serial_number,
        purchaseDate: data.equipment_purchase_date,
        lastMaintenance: data.equipment_last_maintenance,
        description: data.equipment_description,
        image: data.equipment_image,
        value: data.equipment_value,
        patrimonyNumber: data.equipment_patrimony_number,
        depreciatedValue: data.equipment_depreciated_value,
        receiveDate: data.equipment_receive_date,
        store: data.equipment_store,
        invoice: data.equipment_invoice,
        currentLoanId: data.equipment_current_loan_id,
        currentBorrower: data.equipment_current_borrower,
        lastLoanDate: data.equipment_last_loan_date,
        loanInfo: {
          loanId: data.loan_id,
          borrowerName: data.loan_borrower_name,
          loanDate: data.loan_date,
          expectedReturnDate: data.loan_expected_return_date,
          status: data.loan_status as Loan['status']
        }
      }));

      setEquipment(projectEquipment);
    } catch (err) {
      console.error('Error fetching project equipment:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar equipamentos do projeto');
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