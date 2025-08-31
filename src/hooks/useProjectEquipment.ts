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
      setError(null);
      
      console.log('🔍 Fetching equipment for project:', projectId);
      
      // Usar a função segura do banco para buscar equipamentos do projeto
      const { data: projectEquipmentData, error } = await supabase
        .rpc('get_project_equipment', { _project_id: projectId });

      console.log('📊 RPC get_project_equipment result:', {
        data: projectEquipmentData,
        error: error,
        projectId
      });

      if (error) {
        console.error('❌ Error in get_project_equipment RPC:', error);
        throw error;
      }

      if (!projectEquipmentData || projectEquipmentData.length === 0) {
        console.log('📭 No equipment found for project:', projectId);
        setEquipment([]);
        return;
      }

      // Transformar dados para o formato esperado
      const projectEquipment: ProjectEquipment[] = projectEquipmentData.map(item => {
        console.log('🔄 Transforming equipment item:', {
          rawItem: item,
          equipment_id: item.equipment_id,
          equipment_name: item.equipment_name,
          equipment_item_type: item.equipment_item_type,
          equipment_parent_id: item.equipment_parent_id
        });

        return {
          id: item.equipment_id,
          name: item.equipment_name,
          brand: item.equipment_brand,
          category: item.equipment_category as EquipmentCategory,
          subcategory: item.equipment_subcategory,
          customCategory: item.equipment_custom_category,
          status: item.equipment_status as Equipment['status'],
          itemType: item.equipment_item_type as Equipment['itemType'],
          parentId: item.equipment_parent_id,
          hasAccessories: false,
          isExpanded: false,
          serialNumber: item.equipment_serial_number,
          purchaseDate: item.equipment_purchase_date,
          lastMaintenance: item.equipment_last_maintenance,
          description: item.equipment_description,
          image: item.equipment_image,
          value: item.equipment_value,
          patrimonyNumber: item.equipment_patrimony_number,
          depreciatedValue: item.equipment_depreciated_value,
          receiveDate: item.equipment_receive_date,
          store: item.equipment_store,
          invoice: item.equipment_invoice,
          currentLoanId: item.equipment_current_loan_id,
          currentBorrower: item.equipment_current_borrower,
          lastLoanDate: item.equipment_last_loan_date,
          loanInfo: {
            loanId: item.loan_id,
            borrowerName: item.loan_borrower_name,
            loanDate: item.loan_date,
            expectedReturnDate: item.loan_expected_return_date,
            status: item.loan_status as Loan['status']
          }
        };
      });

      console.log('✅ Transformed equipment data:', {
        totalItems: projectEquipment.length,
        mainItems: projectEquipment.filter(eq => eq.itemType === 'main').length,
        accessories: projectEquipment.filter(eq => eq.itemType === 'accessory').length,
        items: projectEquipment.map(eq => ({
          id: eq.id,
          name: eq.name,
          itemType: eq.itemType,
          parentId: eq.parentId,
          category: eq.category
        }))
      });

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