/**
 * Utility functions for generating standardized equipment image filenames
 * 
 * Naming convention: {equipment_id}_{patrimony_sanitized}.webp
 * - equipment_id: Always present, unique identifier (UUID)
 * - patrimony_sanitized: Optional, human-readable patrimony number (sanitized)
 * 
 * Examples:
 * - "123e4567-e89b-12d3-a456-426614174000_PAT001.webp"
 * - "123e4567-e89b-12d3-a456-426614174000.webp" (without patrimony)
 */

/**
 * Sanitizes a patrimony number for use in filenames
 * Removes/replaces characters that could cause issues in filenames
 * 
 * @param patrimony - Raw patrimony number string
 * @returns Sanitized string safe for use in filenames
 */
export function sanitizePatrimonyNumber(patrimony: string | null | undefined): string {
  if (!patrimony || patrimony.trim() === '') {
    return '';
  }

  return patrimony
    .trim()
    // Remove caracteres especiais problemáticos
    .replace(/[/\\:*?"<>|]/g, '')
    // Substitui espaços por underscores
    .replace(/\s+/g, '_')
    // Remove múltiplos underscores consecutivos
    .replace(/_+/g, '_')
    // Remove underscores no início e fim
    .replace(/^_+|_+$/g, '')
    // Limita a 50 caracteres para evitar nomes muito longos
    .slice(0, 50);
}

/**
 * Generates a standardized filename for equipment images
 * Format: {equipment_id}_{patrimony_sanitized}_{timestamp}.webp
 * 
 * The timestamp ensures each upload generates a unique filename,
 * eliminating browser cache issues without needing query parameters.
 * 
 * @param equipmentId - UUID of the equipment (required)
 * @param patrimonyNumber - Patrimony number (optional, can be null/undefined)
 * @returns Standardized filename with .webp extension and unique timestamp
 * 
 * @example
 * generateEquipmentImageName('123-abc', 'PAT-001')
 * // Returns: "123-abc_PAT-001_1733857200000.webp"
 * 
 * @example
 * generateEquipmentImageName('123-abc', null)
 * // Returns: "123-abc_1733857200000.webp"
 * 
 * @example
 * generateEquipmentImageName('123-abc', 'PAT/001*TEST')
 * // Returns: "123-abc_PAT001TEST_1733857200000.webp"
 */
export function generateEquipmentImageName(
  equipmentId: string,
  patrimonyNumber?: string | null
): string {
  const sanitizedPatrimony = sanitizePatrimonyNumber(patrimonyNumber);
  const timestamp = Date.now();
  
  if (sanitizedPatrimony) {
    return `${equipmentId}_${sanitizedPatrimony}_${timestamp}.webp`;
  }
  
  return `${equipmentId}_${timestamp}.webp`;
}
