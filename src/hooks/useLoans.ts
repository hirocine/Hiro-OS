import { useState, useMemo, useEffect } from 'react';
import { Loan, LoanFilters, LoanStats } from '@/types/loan';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

export function useLoans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filters, setFilters] = useState<LoanFilters>({});
  const [loading, setLoading] = useState(true);
  const { isAdmin, loading: roleLoading } = useUserRole();

  // Fetch loans from Supabase (admin only)
  useEffect(() => {
    if (!roleLoading) {
      fetchLoans();
    }
  }, [isAdmin, roleLoading]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      
      // Only admins can access loan data
      if (!isAdmin) {
        setLoans([]);
        return;
      }

      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching loans:', error);
        return;
      }

      // Transform database data to match Loan interface
      const loanData = (data || []).map(item => ({
        ...item,
        loanDate: item.loan_date,
        expectedReturnDate: item.expected_return_date,
        actualReturnDate: item.actual_return_date,
        equipmentId: item.equipment_id,
        equipmentName: item.equipment_name,
        borrowerName: item.borrower_name,
        borrowerEmail: item.borrower_email,
        borrowerPhone: item.borrower_phone,
        returnCondition: item.return_condition,
        returnNotes: item.return_notes
      })) as Loan[];
      setLoans(loanData);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const addLoan = async (newLoan: Omit<Loan, 'id'>) => {
    if (!isAdmin) {
      console.error('Only admins can add loans');
      return;
    }
    
    try {
      // Transform to database format
      const dbLoan = {
        equipment_id: newLoan.equipmentId,
        equipment_name: newLoan.equipmentName,
        borrower_name: newLoan.borrowerName,
        borrower_email: newLoan.borrowerEmail,
        borrower_phone: newLoan.borrowerPhone,
        department: newLoan.department,
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
        console.error('Error adding loan:', error);
        return;
      }

      if (data) {
        const loanData = {
          ...data,
          loanDate: data.loan_date,
          expectedReturnDate: data.expected_return_date,
          actualReturnDate: data.actual_return_date,
          equipmentId: data.equipment_id,
          equipmentName: data.equipment_name,
          borrowerName: data.borrower_name,
          borrowerEmail: data.borrower_email,
          borrowerPhone: data.borrower_phone,
          returnCondition: data.return_condition,
          returnNotes: data.return_notes
        } as Loan;
        setLoans(prev => [...prev, loanData]);
      }
    } catch (error) {
      console.error('Error adding loan:', error);
    }
  };

  const updateLoan = async (id: string, updates: Partial<Loan>) => {
    if (!isAdmin) {
      console.error('Only admins can update loans');
      return;
    }
    
    try {
      // Transform updates to database format
      const dbUpdates: any = {};
      if (updates.equipmentId) dbUpdates.equipment_id = updates.equipmentId;
      if (updates.equipmentName) dbUpdates.equipment_name = updates.equipmentName;
      if (updates.borrowerName) dbUpdates.borrower_name = updates.borrowerName;
      if (updates.borrowerEmail) dbUpdates.borrower_email = updates.borrowerEmail;
      if (updates.borrowerPhone) dbUpdates.borrower_phone = updates.borrowerPhone;
      if (updates.loanDate) dbUpdates.loan_date = updates.loanDate;
      if (updates.expectedReturnDate) dbUpdates.expected_return_date = updates.expectedReturnDate;
      if (updates.actualReturnDate) dbUpdates.actual_return_date = updates.actualReturnDate;
      if (updates.returnCondition) dbUpdates.return_condition = updates.returnCondition;
      if (updates.returnNotes) dbUpdates.return_notes = updates.returnNotes;
      
      // Direct mappings
      ['department', 'project', 'status', 'notes'].forEach(field => {
        if (updates[field as keyof Loan] !== undefined) {
          dbUpdates[field] = updates[field as keyof Loan];
        }
      });

      const { error } = await supabase
        .from('loans')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        console.error('Error updating loan:', error);
        return;
      }

      setLoans(prev =>
        prev.map(loan => loan.id === id ? { ...loan, ...updates } : loan)
      );
    } catch (error) {
      console.error('Error updating loan:', error);
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