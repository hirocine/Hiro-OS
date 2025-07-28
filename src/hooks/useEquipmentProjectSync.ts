import { useEffect } from 'react';
import { useEquipment } from './useEquipment';
import { useLoans } from './useLoans';

/**
 * Hook para sincronizar status de equipamentos com empréstimos
 * Atualiza automaticamente o status dos equipamentos baseado nos empréstimos ativos
 */
export function useEquipmentProjectSync() {
  const { allEquipment, updateEquipment } = useEquipment();
  const { allLoans } = useLoans();

  useEffect(() => {
    // Mapear quais equipamentos estão em empréstimos ativos
    const activeLoansMap = new Map();
    
    allLoans
      .filter(loan => loan.status === 'active' || loan.status === 'overdue')
      .forEach(loan => {
        activeLoansMap.set(loan.equipmentId, {
          loanId: loan.id,
          borrower: loan.borrowerName,
          project: loan.project,
          loanDate: loan.loanDate
        });
      });

    // Atualizar equipamentos conforme necessário
    allEquipment.forEach(equipment => {
      const activeLoan = activeLoansMap.get(equipment.id);
      
      if (activeLoan) {
        // Equipamento deveria estar como "em uso" mas não está
        if (!equipment.currentLoanId || equipment.currentBorrower !== activeLoan.borrower) {
          updateEquipment(equipment.id, {
            currentLoanId: activeLoan.loanId,
            currentBorrower: activeLoan.borrower,
            lastLoanDate: activeLoan.loanDate
          });
        }
      } else {
        // Equipamento não tem empréstimo ativo mas está marcado como emprestado
        if (equipment.currentLoanId) {
          updateEquipment(equipment.id, {
            currentLoanId: undefined,
            currentBorrower: undefined
          });
        }
      }
    });
  }, [allEquipment, allLoans, updateEquipment]);

  return {
    // Função para forçar sincronização
    syncEquipmentStatus: () => {
      // A sincronização já acontece automaticamente via useEffect
      console.log('Equipment status sync triggered');
    }
  };
}