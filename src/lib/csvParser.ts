import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Equipment, EquipmentCategory, EquipmentStatus, EquipmentItemType } from '@/types/equipment';
import { logger } from '@/lib/logger';

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

export interface ImportSummary {
  totalParsed: number;
  mainsNew: number;
  accessoriesNew: number;
  mainsExisting: number;
  accessoriesExisting: number;
  skippedMissingParent: number;
  errors: string[];
}

// Chaves em inglês bloqueadas - não são mais aceitas na importação
const BLOCKED_ENGLISH_KEYS = ['camera', 'monitoring', 'audio', 'lighting', 'grip', 'electrical', 'storage', 'computers', 'miscellaneous', 'accessories'];
const VALID_STATUSES: EquipmentStatus[] = ['available', 'maintenance'];
const VALID_ITEM_TYPES: EquipmentItemType[] = ['main', 'accessory'];

/**
 * Extrai o prefixo do número de patrimônio antes do último ponto
 * Exemplo: "00007.1" → "00007"
 */
function extractPatrimonyPrefix(patrimonyNumber: string): string | null {
  if (!patrimonyNumber || !patrimonyNumber.includes('.')) {
    return null;
  }
  const lastDotIndex = patrimonyNumber.lastIndexOf('.');
  return patrimonyNumber.substring(0, lastDotIndex);
}

/**
 * Verifica se um número de patrimônio segue o padrão de item principal (termina em .0)
 */
function isMainItemPatrimony(patrimonyNumber: string): boolean {
  return patrimonyNumber?.endsWith('.0') || false;
}

/**
 * Verifica se um número de patrimônio segue o padrão de acessório (termina em .X onde X != 0)
 */
function isAccessoryPatrimony(patrimonyNumber: string): boolean {
  if (!patrimonyNumber || !patrimonyNumber.includes('.')) {
    return false;
  }
  const parts = patrimonyNumber.split('.');
  const suffix = parts[parts.length - 1];
  return suffix !== '0';
}

const COLUMN_MAPPING = {
  'patrimônio': 'patrimonyNumber',
  'patrimonio': 'patrimonyNumber',
  'numero de patrimonio': 'patrimonyNumber',
  'numero patrimonio': 'patrimonyNumber',
  'n patrimonio': 'patrimonyNumber',
  'numero do patrimonio': 'patrimonyNumber',
  'nro patrimonio': 'patrimonyNumber',
  'nome': 'name',
  'marca': 'brand',
  'categoria': 'category',
  'subcategoria': 'subcategory',
  'tipo de item': 'itemType',
  'tipo item': 'itemType',
  'tipo': 'itemType',
  'item principal': 'parentId',
  'item mae': 'parentId',
  'item mãe': 'parentId',
  'principal': 'parentId',
  'pai': 'parentId',
  'serial': 'serialNumber',
  'numero de serie': 'serialNumber',
  'numero serie': 'serialNumber',
  'n serie': 'serialNumber',
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
  'capacidade': 'capacity',
  'loja': 'store',
  'nfe ou recibo': 'invoice',
  'nfe': 'invoice',
  'recibo': 'invoice',
  'nota fiscal': 'invoice',
  'nf': 'invoice',
  'url da imagem': 'image',
  'imagem': 'image'
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
  return key
    .toLowerCase()
    .trim()
    .normalize('NFD')           // Decompõe caracteres Unicode (ó → o + ́)
    .replace(/[\u0300-\u036f]/g, '')  // Remove diacríticos (acentos)
    .replace(/[^\w\s]/g, '');   // Remove outros caracteres especiais
}

function mapColumn(header: string): string | null {
  const normalized = normalizeKey(header);
  return COLUMN_MAPPING[normalized as keyof typeof COLUMN_MAPPING] || null;
}

function validateAndTransformCategory(value: string): string | null {
  if (!value) return null;
  
  // CRÍTICO: Remover TODOS os whitespace invisíveis (newlines, tabs, espaços)
  const cleaned = value
    .replace(/[\n\r\t]/g, '') // Remove newlines, carriage returns, tabs
    .trim(); // Remove espaços no início/fim
  
  const normalized = normalizeKey(cleaned);
  
  // Bloquear categorias em inglês - devem estar em português
  if (BLOCKED_ENGLISH_KEYS.includes(normalized)) {
    return null; // Vai gerar erro na validação
  }
  
  // Aceitar qualquer categoria customizada em português
  return cleaned;
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

function validateRow(row: Record<string, any>, index: number, mainItemsLookup?: Map<string, string>): { equipment: Omit<Equipment, 'id'> | null; errors: ImportError[] } {
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

  // PATRIMÔNIO É OBRIGATÓRIO para importação
  if (!row.patrimonyNumber?.trim()) {
    errors.push({
      row: rowNumber,
      field: 'patrimonyNumber',
      message: 'Número de patrimônio é obrigatório para importação',
      value: row.patrimonyNumber
    });
  }


  // Validate and transform category (accepts custom categories)
  const category = validateAndTransformCategory(row.category);
  if (!category) {
    const normalized = normalizeKey(row.category || '');
    const isEnglish = BLOCKED_ENGLISH_KEYS.includes(normalized);
    
    errors.push({
      row: rowNumber,
      field: 'category',
      message: isEnglish 
        ? 'Categoria deve estar em português (ex: "Câmera", "Áudio", "Iluminação"). Valores em inglês não são aceitos.'
        : 'Categoria é obrigatória',
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

  // Parent ID validation for accessories - AUTO-DETECT by patrimony pattern
  let parentId: string | undefined;
  
  if (itemType === 'accessory') {
    // ESTRATÉGIA 1: Detecção automática pelo padrão de numeração
    if (row.patrimonyNumber?.trim() && mainItemsLookup) {
      const patrimonyNumber = row.patrimonyNumber.trim();
      
      if (isAccessoryPatrimony(patrimonyNumber)) {
        const prefix = extractPatrimonyPrefix(patrimonyNumber);
        
        if (prefix) {
          // Procurar pelo item principal com padrão PREFIX.0
          const mainItemPatrimony = `${prefix}.0`;
          
          if (mainItemsLookup.has(mainItemPatrimony)) {
            parentId = mainItemsLookup.get(mainItemPatrimony);
            logger.debug('[AUTO-LINK] Accessory linked to main item', {
              module: 'csv-parser',
              action: 'auto_link',
              data: { accessory: patrimonyNumber, mainItem: mainItemPatrimony }
            });
          }
        }
      }
    }
    
    // ESTRATÉGIA 2: Fallback para coluna "Item Principal" (comportamento atual)
    if (!parentId && row.parentId?.trim()) {
      parentId = row.parentId.trim();
      logger.debug('[MANUAL-LINK] Accessory using parent column', {
        module: 'csv-parser',
        action: 'manual_link',
        data: { parentId }
      });
    }
  }

  // Date validation with improved format checking
  const validateDate = (dateStr: string, fieldName: string) => {
    if (dateStr && dateStr.trim()) {
      // Support multiple date formats
      const cleanDate = dateStr.trim();
      let date: Date;
      
      // Try parsing as dd/MM/yyyy format (from export)
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDate)) {
        const [day, month, year] = cleanDate.split('/');
        date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
      }
      // Try parsing as ISO format (YYYY-MM-DD)
      else if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        date = new Date(cleanDate + 'T00:00:00.000Z');
      }
      // Fallback to standard Date parsing
      else {
        date = new Date(cleanDate);
      }
      
      if (isNaN(date.getTime())) {
        errors.push({
          row: rowNumber,
          field: fieldName,
          message: 'Data inválida (use formato YYYY-MM-DD ou dd/MM/yyyy)',
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
  const capacity = validateNumber(row.capacity, 'capacity');

  // Validate patrimony number format
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

  // Normalizar patrimônio: principais terminam com .0
  let normalizedPatrimony = row.patrimonyNumber?.trim();
  if (normalizedPatrimony && itemType === 'main') {
    if (!normalizedPatrimony.includes('.')) {
      normalizedPatrimony = `${normalizedPatrimony}.0`;
    } else if (!normalizedPatrimony.endsWith('.0')) {
      normalizedPatrimony = `${normalizedPatrimony}.0`;
    }
  }

  const equipment: Omit<Equipment, 'id'> = {
    name: row.name.trim(),
    brand: row.brand.trim(),
    category: category!,
    subcategory: row.subcategory ? row.subcategory.replace(/[\n\r\t]/g, '').trim() : undefined,
    status: status!,
    itemType: itemType!,
    parentId,
    serialNumber: row.serialNumber?.trim() || undefined,
    purchaseDate,
    lastMaintenance,
    description: row.description?.trim() || undefined,
    image: row.image?.trim() || undefined,
    value,
    patrimonyNumber: normalizedPatrimony || undefined,
    depreciatedValue,
    receiveDate,
    capacity,
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
        const allRows = results.data as Record<string, any>[];
        const mainItemsLookup = new Map<string, string>();
        
        // First pass: process main items and build lookup
        allRows.forEach((row: Record<string, any>, index: number) => {
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
                
                // Se o patrimônio segue o padrão .0, indexar também por prefixo
                if (isMainItemPatrimony(equipment.patrimonyNumber)) {
                  const prefix = extractPatrimonyPrefix(equipment.patrimonyNumber);
                  if (prefix) {
                    mainItemsLookup.set(prefix, equipmentId);
                  }
                }
              }
              if (equipment.name) {
                mainItemsLookup.set(equipment.name, equipmentId);
              }
            }
            
            errors.push(...rowErrors);
          }
        });

        // Second pass: process accessories with parent references
        allRows.forEach((row: Record<string, any>, index: number) => {
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
        const allRows: Array<{ row: Record<string, any>; index: number }> = [];
        rows.forEach((row: any[], index: number) => {
          if (row.length === 0) return;

          const rowObject: Record<string, any> = {};
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
                
                // Se o patrimônio segue o padrão .0, indexar também por prefixo
                if (isMainItemPatrimony(equipmentItem.patrimonyNumber)) {
                  const prefix = extractPatrimonyPrefix(equipmentItem.patrimonyNumber);
                  if (prefix) {
                    mainItemsLookup.set(prefix, equipmentId);
                  }
                }
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
    'Categoria',
    'Subcategoria',
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
    'Capacidade',
    'Loja',
    'NFe ou Recibo',
    'URL da Imagem'
  ];

  const exampleRows = [
    [
      '00007.0',
      'Aputure MC Light',
      'Aputure',
      'Iluminação',
      'Portátil',
      'Principal',
      '',
      'SN001',
      '1200.00',
      'disponível',
      '2024-01-15',
      '',
      'Luz LED RGB portátil',
      '1100.00',
      '2024-01-10',
      '',
      'Loja A',
      'NF12345',
      'https://exemplo.com/imagem1.jpg'
    ],
    [
      '00007.1',
      'Silicone Diffuser',
      'Aputure',
      'Diversos',
      'Difusores',
      'Acessório',
      '',
      'SN002',
      '50.00',
      'disponível',
      '2024-01-15',
      '',
      'Difusor de silicone - Auto-vinculado pelo padrão 00007.X',
      '45.00',
      '2024-01-10',
      '',
      'Loja A',
      'NF12345',
      'https://exemplo.com/imagem2.jpg'
    ],
    [
      '00010.0',
      'DJI Mavic 3 Cine',
      'DJI',
      'Câmera',
      'Drone',
      'Principal',
      '',
      'SN003',
      '15000.00',
      'disponível',
      '2024-02-01',
      '',
      'Drone profissional com câmera 4K',
      '14000.00',
      '2024-01-28',
      '2000',
      'Loja B',
      'NF67890',
      'https://exemplo.com/imagem3.jpg'
    ],
    [
      '00010.1',
      'Bateria Extra DJI',
      'DJI',
      'Diversos',
      'Baterias',
      'Acessório',
      '',
      'SN004',
      '800.00',
      'disponível',
      '2024-02-01',
      '',
      'Bateria extra - Auto-vinculado pelo padrão 00010.X',
      '750.00',
      '2024-01-28',
      '',
      'Loja B',
      'NF67890',
      ''
    ]
  ];

  return Papa.unparse([headers, ...exampleRows]);
}