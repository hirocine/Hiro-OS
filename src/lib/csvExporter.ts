import Papa from 'papaparse';
import { Equipment } from '@/types/equipment';
import { logger } from '@/lib/logger';

/**
 * Converte um equipamento para formato CSV row
 */
export function equipmentToCSVRow(equipment: Equipment): Record<string, any> {
  return {
    'Nome': equipment.name || '',
    'Marca': equipment.brand || '',
    'Categoria': equipment.category || '',
    'Subcategoria': equipment.subcategory || '',
    'Status': equipment.status || '',
    'Tipo': equipment.itemType === 'main' ? 'Principal' : 'Acessório',
    'Número de Patrimônio': equipment.patrimonyNumber || '',
    'Número de Série': equipment.serialNumber || '',
    'Data de Compra': equipment.purchaseDate || '',
    'Data de Recebimento': equipment.receiveDate || '',
    'Valor': equipment.value?.toString() || '',
    'Valor Depreciado': equipment.depreciatedValue?.toString() || '',
    'Capacidade': equipment.capacity?.toString() || '',
    'Descrição': equipment.description || '',
    'Loja': equipment.store || '',
    'Nota Fiscal': equipment.invoice || '',
    'Última Manutenção': equipment.lastMaintenance || '',
    'URL da Imagem': equipment.image || '',
  };
}

/**
 * Exporta uma lista de equipamentos para CSV e faz download automático
 */
export function exportEquipmentToCSV(
  equipment: Equipment[],
  filename: string = 'equipamentos.csv'
): void {
  if (equipment.length === 0) {
    logger.warn('No equipment to export', {
      module: 'csv-exporter',
      action: 'export_csv'
    });
    return;
  }

  // Converter equipamentos para formato CSV
  const csvData = equipment.map(equipmentToCSVRow);

  // Gerar CSV usando Papa Parse
  const csv = Papa.unparse(csvData, {
    quotes: true,
    delimiter: ',',
    header: true,
    newline: '\n',
  });

  // Criar blob com BOM para UTF-8 (garante acentos corretos no Excel)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });

  // Criar link de download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Limpar URL object
  URL.revokeObjectURL(url);
}
