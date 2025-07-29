export type EquipmentCategory = 'camera' | 'audio' | 'lighting' | 'accessories';

export type EquipmentStatus = 'available' | 'maintenance';

export type EquipmentItemType = 'main' | 'accessory';

export interface Equipment {
  id: string;
  name: string;
  brand: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  itemType: EquipmentItemType;
  parentId?: string;
  hasAccessories?: boolean;
  isExpanded?: boolean;
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
  itemType?: EquipmentItemType;
  search?: string;
}

export interface DashboardStats {
  total: number;
  available: number;
  inUse: number;
  maintenance: number;
  mainItems: number;
  accessories: number;
  byCategory: Record<EquipmentCategory, number>;
  byItemType: Record<EquipmentItemType, number>;
}

export interface EquipmentHierarchy {
  item: Equipment;
  accessories: Equipment[];
}