import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/types/equipment';
import { toast } from 'sonner';
import { SSDStatus } from './useSSDs';
import { useUserRole } from './useUserRole';
import { logger } from '@/lib/logger';

import { ProjectAllocation } from '@/components/SSD/ProjectAllocationList';

export interface SSDExternalLoan {
  id?: string;
  ssd_id: string;
  borrower_name: string;
  loan_date: string;
  expected_return_date: string;
  actual_return_date?: string;
}

export function useSSDDetails(ssd: Equipment | null) {
  const [allocations, setAllocations] = useState<ProjectAllocation[]>([]);
  const [externalLoan, setExternalLoan] = useState<SSDExternalLoan | null>(null);
  const [loading, setLoading] = useState(false);
  const { logAuditEntry } = useUserRole();

  useEffect(() => {
    if (ssd?.id) {
      fetchDetails();
    }
  }, [ssd?.id]);

  const fetchDetails = async () => {
    if (!ssd?.id) return;

    setLoading(true);
    try {
      // Buscar alocações
      const { data: allocData, error: allocError } = await supabase
        .from('ssd_allocations')
        .select('*')
        .eq('ssd_id', ssd.id);

      if (allocError) throw allocError;
      setAllocations(allocData || []);

      // Buscar empréstimo externo ativo
      const { data: loanData, error: loanError } = await supabase
        .from('ssd_external_loans')
        .select('*')
        .eq('ssd_id', ssd.id)
        .is('actual_return_date', null)
        .maybeSingle();

      if (loanError) throw loanError;
      setExternalLoan(loanData);
    } catch (error) {
      logger.error('Failed to fetch SSD details', {
        module: 'ssd',
        data: { ssdId: ssd.id },
        error
      });
      toast.error('Erro ao carregar detalhes do SSD');
    } finally {
      setLoading(false);
    }
  };

  const updateSSD = async (
    status: SSDStatus,
    internalUserId: string | null,
    allocationsData: ProjectAllocation[],
    externalLoanData: SSDExternalLoan | null
  ) => {
    if (!ssd?.id) return false;

    setLoading(true);
    try {
      // Calcular display_order baseado no status
      let displayOrder = 0;
      if (status === 'in_use') displayOrder = 1000;
      else if (status === 'loaned') displayOrder = 2000;

      // Atualizar equipamento
      const { error: equipError } = await supabase
        .from('equipments')
        .update({
          display_order: displayOrder,
          internal_user_id: internalUserId
        })
        .eq('id', ssd.id);

      if (equipError) throw equipError;

      // Remover alocações antigas
      await supabase
        .from('ssd_allocations')
        .delete()
        .eq('ssd_id', ssd.id);

      // Adicionar novas alocações (apenas se tiver projeto e GB > 0)
      if (allocationsData.length > 0) {
        const validAllocations = allocationsData.filter(
          a => a.project_name.trim() !== '' && a.allocated_gb > 0
        );

        if (validAllocations.length > 0) {
          const { error: allocError } = await supabase
            .from('ssd_allocations')
            .insert(
              validAllocations.map(a => ({
                ssd_id: ssd.id,
                project_name: a.project_name,
                allocated_gb: a.allocated_gb
              }))
            );

          if (allocError) throw allocError;
        }
      }

      // Gerenciar empréstimo externo
      if (status === 'loaned' && externalLoanData) {
        // Fechar empréstimo anterior se houver
        if (externalLoan?.id) {
          await supabase
            .from('ssd_external_loans')
            .update({ actual_return_date: new Date().toISOString().split('T')[0] })
            .eq('id', externalLoan.id);
        }

        // Criar novo empréstimo
        const { error: loanError } = await supabase
          .from('ssd_external_loans')
          .insert({
            ssd_id: ssd.id,
            borrower_name: externalLoanData.borrower_name,
            loan_date: externalLoanData.loan_date,
            expected_return_date: externalLoanData.expected_return_date
          });

        if (loanError) throw loanError;
      } else if (status !== 'loaned' && externalLoan?.id) {
        // Fechar empréstimo se mudar para outro status
        await supabase
          .from('ssd_external_loans')
          .update({ actual_return_date: new Date().toISOString().split('T')[0] })
          .eq('id', externalLoan.id);
      }

      // Log de auditoria
      await logAuditEntry(
        'update_ssd_details',
        'equipments',
        ssd.id,
        {
          internal_user_id: ssd.internal_user_id,
          allocations: allocations,
          external_loan: externalLoan
        },
        {
          internal_user_id: internalUserId,
          status: status,
          allocations: allocationsData,
          external_loan: externalLoanData
        }
      );
      
      toast.success('SSD atualizado com sucesso!');
      return true;
    } catch (error) {
      logger.error('Failed to update SSD', {
        module: 'ssd',
        data: { ssdId: ssd.id },
        error
      });
      toast.error('Erro ao atualizar SSD');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    allocations,
    externalLoan,
    loading,
    updateSSD,
    refetch: fetchDetails
  };
}
