export type EquipmentCategory = 'camera' | 'audio' | 'lighting' | 'accessories';

export type EquipmentStatus = 'available' | 'maintenance';

export interface Equipment {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  serialNumber?: string;
  purchaseDate?: string;
  lastMaintenance?: string;
  description?: string;
  image?: string;
  value?: number;
  patrimonyNumber?: string;
  depreciatedValue?: number;
  receiveDate?: string;
  store?: string;
  invoice?: string;
  currentLoanId?: string;
  currentBorrower?: string;
  lastLoanDate?: string;
}

export interface EquipmentFilters {
  category?: EquipmentCategory;
  status?: EquipmentStatus;
  search?: string;
}

export interface DashboardStats {
  total: number;
  available: number;
  inUse: number;
  maintenance: number;
  byCategory: Record<EquipmentCategory, number>;
}