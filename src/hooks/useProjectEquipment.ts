import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipment, EquipmentCategory } from '@/types/equipment';
import { Loan } from '@/types/loan';
import { logger } from '@/lib/logger';
import { wrapAsync } from '@/lib/errors';

interface ProjectEquipment extends Equipment {
  loanInfo: {
    loanId: string;
    borrowerName: string;
    loanDate: string;
    expectedReturnDate: string;
    status: Loan['status'];
  };
  accessoryCount?: number;
}

export function useProjectEquipment(projectId: string) {
  const [equipment, setEquipment] = useState<ProjectEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectEquipment = async () => {
    logger.debug('Fetching equipment for project', { 
      module: 'project-equipment', 
      data: { projectId },
      action: 'fetch_project_equipment' 
    });

    const result = await wrapAsync(async () => {
      setLoading(true);
      setError(null);

      // Usar a função segura do banco para buscar equipamentos do projeto
      const { data: projectEquipmentData, error } = await supabase
        .rpc('get_project_equipment', { _project_id: projectId });

      logger.apiResponse('POST', 'get_project_equipment', !error, { 
        resultCount: projectEquipmentData?.length || 0,
        hasError: !!error 
      });

      if (error) {
        throw new Error(`Failed to fetch project equipment: ${error.message}`);
      }

      if (!projectEquipmentData || projectEquipmentData.length === 0) {
        logger.info('No equipment found for project', { 
          module: 'project-equipment', 
          data: { projectId }
        });
        setEquipment([]);
        return [];
      }

      // Transformar dados para o formato esperado
      const projectEquipment: ProjectEquipment[] = projectEquipmentData.map(item => {
        logger.debug('Transforming equipment item', {
          module: 'project-equipment',
          data: {
            equipmentId: item.equipment_id,
            equipmentName: item.equipment_name,
            itemType: item.equipment_item_type
          }
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

      logger.info('Successfully transformed project equipment data', {
        module: 'project-equipment',
        data: {
          totalItems: projectEquipment.length,
          mainItems: projectEquipment.filter(eq => eq.itemType === 'main').length,
          accessories: projectEquipment.filter(eq => eq.itemType === 'accessory').length
        }
      });

      // Enriquecer com contagem de acessórios
      const enrichedEquipment = projectEquipment.map(item => {
        if (item.itemType === 'main') {
          const accessoryCount = projectEquipment.filter(
            eq => eq.parentId === item.id && eq.itemType === 'accessory'
          ).length;
          
          return {
            ...item,
            accessoryCount
          };
        }
        return item;
      });

      setEquipment(enrichedEquipment);
      return enrichedEquipment;
    });

    if (result.data !== undefined) {
      setLoading(false);
    } else if (result.error) {
      logger.error('Failed to fetch project equipment', {
        module: 'project-equipment',
        data: { projectId },
        error: result.error
      });
      setError(result.error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectEquipment();
    }
  }, [projectId]);

  const refetch = async () => {
    await fetchProjectEquipment();
  };

  return { equipment, loading, error, refetch };
}

export function getEquipmentBreakdown(equipment: ProjectEquipment[]): string {
  if (equipment.length === 0) return '';
  
  const categories = equipment.reduce((acc, item) => {
    const category = item.customCategory || item.subcategory || item.category;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const breakdown = Object.entries(categories)
    .map(([cat, count]) => `${count} ${cat}`)
    .join(', ');

  return `${equipment.length} equipamentos: ${breakdown}`;
}