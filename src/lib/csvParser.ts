import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Equipment, EquipmentCategory, EquipmentStatus, EquipmentItemType } from '@/types/equipment';

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface ImportResult {
  data: Omit<Equipment, 'id'>[];
  errors: ImportError[];
  totalRows: number;
  successRows: number;
}

const VALID_CATEGORIES: EquipmentCategory[] = ['camera', 'audio', 'lighting', 'accessories'];
const VALID_STATUSES: EquipmentStatus[] = ['available', 'maintenance'];
const VALID_ITEM_TYPES: EquipmentItemType[] = ['main', 'accessory'];

const COLUMN_MAPPING = {
  'patrimônio': 'patrimonyNumber',
  'patrimonio': 'patrimonyNumber',
  'nome': 'name',
  'marca': 'brand',
  'modelo': 'model',
  'categoria': 'category',
  'tipo de item': 'itemType',
  'tipo item': 'itemType',
  'tipo': 'itemType',
  'item principal': 'parentId',
  'item mae': 'parentId',
  'item mãe': 'parentId',
  'principal': 'parentId',
  'pai': 'parentId',
  'serial': 'serialNumber',
  'valor de compra': 'value',
  'valor': 'value',
  'status': 'status',
  'data de compra': 'purchaseDate',
  'última manutenção': 'lastMaintenance',
  'ultima manutencao': 'lastMaintenance',
  'descrição': 'description',
  'descricao': 'description',
  'valor com depreciação': 'depreciatedValue',
  'valor depreciado': 'depreciatedValue',
  'data de recebimento': 'receiveDate',
  'loja': 'store',
  'nfe ou recibo': 'invoice',
  'nfe': 'invoice',
  'recibo': 'invoice'
};

const CATEGORY_MAPPING = {
  'câmera': 'camera',
  'camera': 'camera',
  'câmeras': 'camera',
  'cameras': 'camera',
  'áudio': 'audio',
  'audio': 'audio',
  'som': 'audio',
  'iluminação': 'lighting',
  'iluminacao': 'lighting',
  'luz': 'lighting',
  'lighting': 'lighting',
  'acessórios': 'accessories',
  'acessorios': 'accessories',
  'accessories': 'accessories'
};

const STATUS_MAPPING = {
  'disponível': 'available',
  'disponivel': 'available',
  'available': 'available',
  'livre': 'available',
  'manutenção': 'maintenance',
  'manutencao': 'maintenance',
  'maintenance': 'maintenance',
  'reparo': 'maintenance'
};

const ITEM_TYPE_MAPPING = {
  'principal': 'main',
  'main': 'main',
  'item principal': 'main',
  'mae': 'main',
  'mãe': 'main',
  'acessório': 'accessory',
  'acessorio': 'accessory',
  'accessory': 'accessory',
  'sub': 'accessory',
  'subitem': 'accessory',
  'sub-item': 'accessory'
};

function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

function mapColumn(header: string): string | null {
  const normalized = normalizeKey(header);
  return COLUMN_MAPPING[normalized as keyof typeof COLUMN_MAPPING] || null;
}

function validateAndTransformCategory(value: string): EquipmentCategory | null {
  if (!value) return null;
  const normalized = normalizeKey(value);
  const mapped = CATEGORY_MAPPING[normalized as keyof typeof CATEGORY_MAPPING];
  return VALID_CATEGORIES.includes(mapped as EquipmentCategory) ? mapped as EquipmentCategory : null;
}

function validateAndTransformStatus(value: string): EquipmentStatus | null {
  if (!value) return 'available'; // Default status
  const normalized = normalizeKey(value);
  const mapped = STATUS_MAPPING[normalized as keyof typeof STATUS_MAPPING];
  return VALID_STATUSES.includes(mapped as EquipmentStatus) ? mapped as EquipmentStatus : null;
}

function validateAndTransformItemType(value: string): EquipmentItemType | null {
  if (!value) return 'main'; // Default to main item
  const normalized = normalizeKey(value);
  const mapped = ITEM_TYPE_MAPPING[normalized as keyof typeof ITEM_TYPE_MAPPING];
  return VALID_ITEM_TYPES.includes(mapped as EquipmentItemType) ? mapped as EquipmentItemType : null;
}

function validateRow(row: any, index: number, mainItemsLookup?: Map<string, string>): { equipment: Omit<Equipment, 'id'> | null; errors: ImportError[] } {
  const errors: ImportError[] = [];
  const rowNumber = index + 2; // +2 because index is 0-based and we have a header row

  // Required fields validation
  if (!row.name?.trim()) {
    errors.push({
      row: rowNumber,
      field: 'name',
      message: 'Nome é obrigatório',
      value: row.name
    });
  }

  if (!row.brand?.trim()) {
    errors.push({
      row: rowNumber,
      field: 'brand',
      message: 'Marca é obrigatória',
      value: row.brand
    });
  }

  if (!row.model?.trim()) {
    errors.push({
      row: rowNumber,
      field: 'model',
      message: 'Modelo é obrigatório',
      value: row.model
    });
  }

  // Validate and transform category
  const category = validateAndTransformCategory(row.category);
  if (!category) {
    errors.push({
      row: rowNumber,
      field: 'category',
      message: `Categoria inválida. Valores aceitos: ${VALID_CATEGORIES.join(', ')}`,
      value: row.category
    });
  }

  // Validate and transform status
  const status = validateAndTransformStatus(row.status);
  if (!status) {
    errors.push({
      row: rowNumber,
      field: 'status',
      message: `Status inválido. Valores aceitos: ${VALID_STATUSES.join(', ')}`,
      value: row.status
    });
  }

  // Validate and transform item type
  const itemType = validateAndTransformItemType(row.itemType);
  if (!itemType) {
    errors.push({
      row: rowNumber,
      field: 'itemType',
      message: `Tipo de item inválido. Valores aceitos: ${VALID_ITEM_TYPES.join(', ')}`,
      value: row.itemType
    });
  }

  // Parent ID validation for accessories - use patrimony number or name as key
  let parentId: string | undefined;
  if (itemType === 'accessory' && row.parentId?.trim()) {
    // Store the parent reference as provided in the CSV for later mapping
    parentId = row.parentId.trim();
  }

  // Date validation with improved format checking
  const validateDate = (dateStr: string, fieldName: string) => {
    if (dateStr && dateStr.trim()) {
      // Support multiple date formats
      const cleanDate = dateStr.trim();
      let date: Date;
      
      // Try parsing as ISO format first (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        date = new Date(cleanDate + 'T00:00:00.000Z');
      } else {
        date = new Date(cleanDate);
      }
      
      if (isNaN(date.getTime())) {
        errors.push({
          row: rowNumber,
          field: fieldName,
          message: 'Data inválida (use formato YYYY-MM-DD)',
          value: dateStr
        });
        return null;
      }
      
      // Return in YYYY-MM-DD format for database consistency
      return date.toISOString().split('T')[0];
    }
    return null;
  };

  const purchaseDate = validateDate(row.purchaseDate, 'purchaseDate');
  const lastMaintenance = validateDate(row.lastMaintenance, 'lastMaintenance');
  const receiveDate = validateDate(row.receiveDate, 'receiveDate');

  // Number validation with better handling
  const validateNumber = (numStr: string, fieldName: string) => {
    if (numStr && numStr.trim()) {
      // Remove currency symbols and spaces
      const cleanNum = numStr.trim().replace(/[R$\s]/g, '').replace(',', '.');
      const num = parseFloat(cleanNum);
      if (isNaN(num) || num < 0) {
        errors.push({
          row: rowNumber,
          field: fieldName,
          message: 'Valor numérico inválido (deve ser um número positivo)',
          value: numStr
        });
        return null;
      }
      return num;
    }
    return null;
  };

  const value = validateNumber(row.value, 'value');
  const depreciatedValue = validateNumber(row.depreciatedValue, 'depreciatedValue');

  // Validate patrimony number uniqueness (basic format check)
  if (row.patrimonyNumber?.trim()) {
    const patrimonyNumber = row.patrimonyNumber.trim();
    if (patrimonyNumber.length < 3) {
      errors.push({
        row: rowNumber,
        field: 'patrimonyNumber',
        message: 'Número de patrimônio deve ter pelo menos 3 caracteres',
        value: patrimonyNumber
      });
    }
  }

  if (errors.length > 0) {
    return { equipment: null, errors };
  }

  const equipment: Omit<Equipment, 'id'> = {
    name: row.name.trim(),
    brand: row.brand.trim(),
    model: row.model.trim(),
    category: category!,
    status: status!,
    itemType: itemType!,
    parentId,
    serialNumber: row.serialNumber?.trim() || undefined,
    purchaseDate,
    lastMaintenance,
    description: row.description?.trim() || undefined,
    image: row.image?.trim() || undefined,
    value,
    patrimonyNumber: row.patrimonyNumber?.trim() || undefined,
    depreciatedValue,
    receiveDate,
    store: row.store?.trim() || undefined,
    invoice: row.invoice?.trim() || undefined,
    isExpanded: false,
  };

  return { equipment, errors };
}

function transformHeaders(headers: string[]): string[] {
  return headers.map(header => {
    const mapped = mapColumn(header);
    return mapped || header;
  });
}

export function parseCSV(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        const mapped = mapColumn(header);
        return mapped || header;
      },
      complete: (results) => {
        const data: Omit<Equipment, 'id'>[] = [];
        const errors: ImportError[] = [];

        // Two-pass processing: first main items, then accessories
        const allRows = results.data as any[];
        const mainItemsLookup = new Map<string, string>();
        
        // First pass: process main items and build lookup
        allRows.forEach((row: any, index: number) => {
          const itemType = validateAndTransformItemType(row.itemType);
          if (itemType === 'main') {
            const { equipment, errors: rowErrors } = validateRow(row, index);
            
            if (equipment) {
              const equipmentId = `temp_${Date.now()}_${index}`;
              equipment.itemType = 'main';
              data.push(equipment);
              
              // Build lookup by patrimony number and name
              if (equipment.patrimonyNumber) {
                mainItemsLookup.set(equipment.patrimonyNumber, equipmentId);
              }
              if (equipment.name) {
                mainItemsLookup.set(equipment.name, equipmentId);
              }
            }
            
            errors.push(...rowErrors);
          }
        });

        // Second pass: process accessories with parent references
        allRows.forEach((row: any, index: number) => {
          const itemType = validateAndTransformItemType(row.itemType);
          if (itemType === 'accessory') {
            const { equipment, errors: rowErrors } = validateRow(row, index, mainItemsLookup);
            
            if (equipment) {
              equipment.itemType = 'accessory';
              data.push(equipment);
            }
            
            errors.push(...rowErrors);
          }
        });

        resolve({
          data,
          errors,
          totalRows: results.data.length,
          successRows: data.length
        });
      },
      error: (error) => {
        resolve({
          data: [],
          errors: [{
            row: 0,
            field: 'file',
            message: `Erro ao processar arquivo: ${error.message}`
          }],
          totalRows: 0,
          successRows: 0
        });
      }
    });
  });
}

export function parseExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          resolve({
            data: [],
            errors: [{
              row: 0,
              field: 'file',
              message: 'Arquivo Excel vazio'
            }],
            totalRows: 0,
            successRows: 0
          });
          return;
        }

        const headers = transformHeaders(jsonData[0] as string[]);
        const rows = jsonData.slice(1);

        const equipment: Omit<Equipment, 'id'>[] = [];
        const errors: ImportError[] = [];

        // Two-pass processing for Excel files too
        const allRows: any[] = [];
        rows.forEach((row: any[], index: number) => {
          if (row.length === 0) return;

          const rowObject: any = {};
          headers.forEach((header, headerIndex) => {
            if (row[headerIndex] !== undefined && row[headerIndex] !== null && row[headerIndex] !== '') {
              rowObject[header] = row[headerIndex];
            }
          });
          
          allRows.push({ row: rowObject, index });
        });

        const mainItemsLookup = new Map<string, string>();
        
        // First pass: process main items
        allRows.forEach(({ row: rowObject, index }) => {
          const itemType = validateAndTransformItemType(rowObject.itemType);
          if (itemType === 'main') {
            const { equipment: equipmentItem, errors: rowErrors } = validateRow(rowObject, index);
            
            if (equipmentItem) {
              const equipmentId = `temp_${Date.now()}_${index}`;
              equipmentItem.itemType = 'main';
              equipment.push(equipmentItem);
              
              // Build lookup
              if (equipmentItem.patrimonyNumber) {
                mainItemsLookup.set(equipmentItem.patrimonyNumber, equipmentId);
              }
              if (equipmentItem.name) {
                mainItemsLookup.set(equipmentItem.name, equipmentId);
              }
            }
            
            errors.push(...rowErrors);
          }
        });

        // Second pass: process accessories
        allRows.forEach(({ row: rowObject, index }) => {
          const itemType = validateAndTransformItemType(rowObject.itemType);
          if (itemType === 'accessory') {
            const { equipment: equipmentItem, errors: rowErrors } = validateRow(rowObject, index, mainItemsLookup);
            
            if (equipmentItem) {
              equipmentItem.itemType = 'accessory';
              equipment.push(equipmentItem);
            }
            
            errors.push(...rowErrors);
          }
        });

        resolve({
          data: equipment,
          errors,
          totalRows: rows.length,
          successRows: equipment.length
        });

      } catch (error) {
        resolve({
          data: [],
          errors: [{
            row: 0,
            field: 'file',
            message: `Erro ao processar arquivo Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          }],
          totalRows: 0,
          successRows: 0
        });
      }
    };

    reader.onerror = () => {
      resolve({
        data: [],
        errors: [{
          row: 0,
          field: 'file',
          message: 'Erro ao ler arquivo'
        }],
        totalRows: 0,
        successRows: 0
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

export function generateTemplate(): string {
  const headers = [
    'Patrimônio',
    'Nome',
    'Marca',
    'Modelo',
    'Categoria',
    'Tipo de Item',
    'Item Principal',
    'Serial',
    'Valor de Compra',
    'Status',
    'Data de Compra',
    'Última Manutenção',
    'Descrição',
    'Valor com Depreciação',
    'Data de Recebimento',
    'Loja',
    'NFe ou Recibo'
  ];

  const exampleRows = [
    [
      'PAT001',
      'Kit Câmera Sony FX6',
      'Sony',
      'FX6',
      'camera',
      'Principal',
      '',
      'SN001',
      '25000.00',
      'disponível',
      '2024-01-15',
      '2024-06-01',
      'Kit completo de câmera profissional',
      '24000.00',
      '2024-01-10',
      'Camera Store',
      'NF-001234'
    ],
    [
      'PAT002',
      'Lente Sony 24-70mm',
      'Sony',
      '24-70mm',
      'accessories',
      'Acessório',
      'PAT001',
      'SN002',
      '5000.00',
      'disponível',
      '2024-01-15',
      '',
      'Lente zoom padrão',
      '4800.00',
      '2024-01-10',
      'Camera Store',
      'NF-001234'
    ],
    [
      'PAT003',
      'Tripé Manfrotto',
      'Manfrotto',
      'MT055',
      'accessories',
      'Acessório',
      'PAT001',
      'SN003',
      '800.00',
      'disponível',
      '2024-01-15',
      '',
      'Tripé profissional em fibra de carbono',
      '750.00',
      '2024-01-10',
      'Camera Store',
      'NF-001234'
    ]
  ];

  return Papa.unparse([headers, ...exampleRows]);
}