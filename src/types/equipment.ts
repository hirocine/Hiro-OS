export type EquipmentCategory = 'camera' | 'audio' | 'lighting' | 'accessories' | 'storage';

export type EquipmentStatus = 'available' | 'maintenance' | 'loaned';

export type EquipmentItemType = 'main' | 'accessory';

export interface Equipment {
  id: string;
  name: string;
  brand: string;
  category: EquipmentCategory;
  subcategory?: string;
  customCategory?: string;
  status: EquipmentStatus;
  simplifiedStatus?: 'available' | 'in_project';
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
  expectedReturnDate?: string;
  capacity?: number;
  displayOrder?: number;
  internal_user_id?: string;
}

export interface EquipmentCategoryData {
  id: string;
  category: string;
  subcategory: string;
  isCustom: boolean;
  createdAt: string;
  createdBy?: string;
}

export type SortableField = 'name' | 'brand' | 'category' | 'subcategory' | 'status' | 'value' | 'patrimonyNumber' | 'purchaseDate';

export type SortOrder = 'asc' | 'desc';

export interface EquipmentFilters {
  category?: EquipmentCategory;
  status?: EquipmentStatus;
  itemType?: EquipmentItemType;
  search?: string;
  sortBy?: SortableField;
  sortOrder?: SortOrder;
  minValue?: number;
  maxValue?: number;
  purchaseDateFrom?: string;
  purchaseDateTo?: string;
  patrimonySeries?: string;
  loanStatus?: 'available' | 'on_loan' | 'overdue';
  sortFields?: Array<{field: SortableField, order: SortOrder}>;
  brand?: string;
  hasImage?: boolean;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: EquipmentFilters;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  total: number;
  available: number;
  inUse: number;
  maintenance: number;
  mainItems: number;
  accessories: number;
  byCategory: Record<EquipmentCategory, number>;
  inUseByCategory: Record<EquipmentCategory, number>;
  byItemType: Record<EquipmentItemType, number>;
  totalValue: number;
  valueByCategory: Record<EquipmentCategory, number>;
}

export interface EquipmentHierarchy {
  item: Equipment;
  accessories: Equipment[];
}