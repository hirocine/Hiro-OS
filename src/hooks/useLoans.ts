import { useState, useMemo } from 'react';
import { Loan, LoanFilters, LoanStats } from '@/types/loan';
import { mockLoans } from '@/data/mockLoans';

export function useLoans() {
  const [loans, setLoans] = useState<Loan[]>(mockLoans);
  const [filters, setFilters] = useState<LoanFilters>({});

  // Update overdue status based on current date
  const updatedLoans = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return loans.map(loan => ({
      ...loan,
      status: loan.status === 'active' && loan.expectedReturnDate < today ? 'overdue' : loan.status
    })) as Loan[];
  }, [loans]);

  const filteredLoans = useMemo(() => {
    return updatedLoans.filter((loan) => {
      if (filters.status && loan.status !== filters.status) return false;
      if (filters.borrower) {
        const searchTerm = filters.borrower.toLowerCase();
        if (!loan.borrowerName.toLowerCase().includes(searchTerm)) return false;
      }
      if (filters.equipment) {
        const searchTerm = filters.equipment.toLowerCase();
        if (!loan.equipmentName.toLowerCase().includes(searchTerm)) return false;
      }
      if (filters.overdue && loan.status !== 'overdue') return false;
      return true;
    });
  }, [updatedLoans, filters]);

  const stats: LoanStats = useMemo(() => {
    const total = updatedLoans.length;
    const active = updatedLoans.filter(loan => loan.status === 'active').length;
    const overdue = updatedLoans.filter(loan => loan.status === 'overdue').length;
    const returned = updatedLoans.filter(loan => loan.status === 'returned').length;
    const overdueEquipment = updatedLoans
      .filter(loan => loan.status === 'overdue')
      .map(loan => loan.equipmentName);

    return {
      total,
      active,
      overdue,
      returned,
      overdueEquipment
    };
  }, [updatedLoans]);

  const addLoan = (newLoan: Omit<Loan, 'id'>) => {
    const id = 'loan-' + Math.random().toString(36).substr(2, 9);
    setLoans(prev => [...prev, { ...newLoan, id }]);
  };

  const updateLoan = (id: string, updates: Partial<Loan>) => {
    setLoans(prev =>
      prev.map(loan => loan.id === id ? { ...loan, ...updates } : loan)
    );
  };

  const returnEquipment = (loanId: string, returnData: {
    returnCondition: Loan['returnCondition'];
    returnNotes?: string;
  }) => {
    const returnDate = new Date().toISOString().split('T')[0];
    updateLoan(loanId, {
      status: 'returned',
      actualReturnDate: returnDate,
      ...returnData
    });
  };

  const getActiveLoanByEquipment = (equipmentId: string): Loan | undefined => {
    return updatedLoans.find(loan => 
      loan.equipmentId === equipmentId && 
      (loan.status === 'active' || loan.status === 'overdue')
    );
  };

  return {
    loans: filteredLoans,
    allLoans: updatedLoans,
    filters,
    setFilters,
    stats,
    addLoan,
    updateLoan,
    returnEquipment,
    getActiveLoanByEquipment
  };
}