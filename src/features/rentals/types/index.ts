export interface RentalEquipment {
  id: string;
  name: string;
  category: string;
  dailyRate: number;
  purchaseValue: number;
  totalRevenue: number;
  totalRentals: number;
  totalDaysRented: number;
  status: 'available' | 'rented' | 'maintenance';
}

export interface Rental {
  id: string;
  equipmentId: string;
  equipmentName: string;
  clientName: string;
  startDate: string;
  endDate: string;
  actualReturnDate?: string;
  dailyRate: number;
  totalValue: number;
  status: 'active' | 'returned' | 'overdue';
  notes?: string;
}

export interface RentalStats {
  totalEquipment: number;
  totalInvested: number;
  totalRevenue: number;
  roi: number; // percentage
  avgOccupancy: number; // percentage
  activeRentals: number;
  overdueRentals: number;
}

export interface MonthlyRentalRevenue {
  month: string;
  revenue: number;
  rentals: number;
}

export interface TopEarner {
  equipmentId: string;
  equipmentName: string;
  category: string;
  totalRevenue: number;
  totalRentals: number;
  occupancyRate: number;
  roi: number;
}
