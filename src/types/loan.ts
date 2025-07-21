export interface Loan {
  id: string;
  equipmentId: string;
  equipmentName: string;
  borrowerName: string;
  borrowerEmail?: string;
  borrowerPhone?: string;
  department?: string;
  project?: string;
  loanDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: 'active' | 'returned' | 'overdue';
  notes?: string;
  returnCondition?: 'excellent' | 'good' | 'fair' | 'damaged';
  returnNotes?: string;
}

export interface LoanFilters {
  status?: Loan['status'];
  borrower?: string;
  equipment?: string;
  overdue?: boolean;
}

export interface LoanStats {
  total: number;
  active: number;
  overdue: number;
  returned: number;
  overdueEquipment: string[];
}