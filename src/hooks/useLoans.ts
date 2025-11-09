import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loan, LoanFilters, LoanStats } from '@/types/loan';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';
import { logger } from '@/lib/logger';
import { handleLegacyError, DatabaseError, NotFoundError, AuthorizationError } from '@/lib/errors';
import type { LoanDbRow, LoanDbInsert, LoanDbUpdate } from '@/types/database';
import { queryKeys } from '@/lib/queryClient';

// Fetch loans function
const fetchLoans = async (isAdmin: boolean): Promise<Loan[]> => {
  // Only admins can access loan data
  if (!isAdmin) {
    return [];
  }

  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logger.database('select', 'loans', false, error);
    throw error;
  }

  // Transform database data to match Loan interface
  const loanData = (data as LoanDbRow[] || []).map((item): Loan => ({
    id: item.id,
    equipmentId: item.equipment_id,
    equipmentName: item.equipment_name,
    borrowerName: item.borrower_name,
    project: item.project,
    loanDate: item.loan_date,
    expectedReturnDate: item.expected_return_date,
    actualReturnDate: item.actual_return_date,
    status: item.status,
    notes: item.notes,
    returnCondition: item.return_condition,
    returnNotes: item.return_notes
  }));
  
  return loanData;
};

export function useLoans() {
  const queryClient = useQueryClient();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [filters, setFilters] = useState<LoanFilters>({});

  // Query for fetching loans
  const { data: loans = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.loans.all,
    queryFn: () => fetchLoans(isAdmin),
    enabled: !roleLoading, // Only fetch when role is loaded
  });

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
        if (!loan.borrowerName?.toLowerCase().includes(searchTerm)) return false;
      }
      if (filters.equipment) {
        const searchTerm = filters.equipment.toLowerCase();
        if (!loan.equipmentName?.toLowerCase().includes(searchTerm)) return false;
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

  // Mutation for adding loan
  const addLoanMutation = useMutation({
    mutationFn: async (newLoan: Omit<Loan, 'id'>): Promise<Loan> => {
      logger.userAction('create_loan', undefined, { equipmentId: newLoan.equipmentId });
      
      // Transform to database format
      const dbLoan: LoanDbInsert = {
        equipment_id: newLoan.equipmentId,
        equipment_name: newLoan.equipmentName,
        borrower_name: newLoan.borrowerName,
        project: newLoan.project,
        loan_date: newLoan.loanDate,
        expected_return_date: newLoan.expectedReturnDate,
        actual_return_date: newLoan.actualReturnDate,
        status: newLoan.status,
        notes: newLoan.notes,
        return_condition: newLoan.returnCondition,
        return_notes: newLoan.returnNotes
      };

      const { data, error } = await supabase
        .from('loans')
        .insert([dbLoan])
        .select()
        .single();

      if (error) {
        logger.database('insert', 'loans', false, error);
        throw new DatabaseError(`Failed to create loan: ${error.message}`, 'insert', 'loans');
      }

      if (data) {
        const loanData: Loan = {
          id: data.id,
          equipmentId: data.equipment_id,
          equipmentName: data.equipment_name,
          borrowerName: data.borrower_name,
          project: data.project,
          loanDate: data.loan_date,
          expectedReturnDate: data.expected_return_date,
          actualReturnDate: data.actual_return_date,
          status: data.status as 'active' | 'returned' | 'overdue',
          notes: data.notes,
          returnCondition: data.return_condition as 'excellent' | 'good' | 'fair' | 'damaged' | undefined,
          returnNotes: data.return_notes
        };
        logger.database('insert', 'loans', true);
        return loanData;
      }

      throw new DatabaseError('Loan creation returned no data', 'insert', 'loans');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
    },
  });

  // Mutation for updating loan
  const updateLoanMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Loan> }): Promise<void> => {
      if (!isAdmin) {
        throw new AuthorizationError('Only admins can update loans', 'loans', 'update');
      }
      
      logger.userAction('update_loan', undefined, { loanId: id, updates });
      
      // Transform updates to database format
      const dbUpdates: Partial<LoanDbUpdate> = {};
      
      if (updates.equipmentId !== undefined) dbUpdates.equipment_id = updates.equipmentId;
      if (updates.equipmentName !== undefined) dbUpdates.equipment_name = updates.equipmentName;
      if (updates.borrowerName !== undefined) dbUpdates.borrower_name = updates.borrowerName;
      if (updates.loanDate !== undefined) dbUpdates.loan_date = updates.loanDate;
      if (updates.expectedReturnDate !== undefined) dbUpdates.expected_return_date = updates.expectedReturnDate;
      if (updates.actualReturnDate !== undefined) dbUpdates.actual_return_date = updates.actualReturnDate;
      if (updates.returnCondition !== undefined) dbUpdates.return_condition = updates.returnCondition;
      if (updates.returnNotes !== undefined) dbUpdates.return_notes = updates.returnNotes;
      if (updates.project !== undefined) dbUpdates.project = updates.project;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { error } = await supabase
        .from('loans')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        logger.database('update', 'loans', false, error);
        throw new DatabaseError(`Failed to update loan: ${error.message}`, 'update', 'loans');
      }

      logger.database('update', 'loans', true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
    },
  });

  const addLoan = async (newLoan: Omit<Loan, 'id'>) => {
    try {
      await addLoanMutation.mutateAsync(newLoan);
    } catch (error) {
      throw handleLegacyError(error, { operation: 'addLoan', equipmentId: newLoan.equipmentId });
    }
  };

  const updateLoan = async (id: string, updates: Partial<Loan>) => {
    try {
      await updateLoanMutation.mutateAsync({ id, updates });
    } catch (error) {
      throw handleLegacyError(error, { operation: 'updateLoan', loanId: id });
    }
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
    loading,
    addLoan,
    updateLoan,
    returnEquipment,
    getActiveLoanByEquipment
  };
}
