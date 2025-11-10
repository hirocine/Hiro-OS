/**
 * Capitaliza a primeira letra de cada palavra em um nome
 * Exemplo: "joão silva" -> "João Silva"
 */
export function capitalizeNames(name: string): string {
  if (!name) return '';
  
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Normaliza uma string removendo acentos, espaços extras e convertendo para minúsculas
 * Útil para comparações de categorias
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\n\r\t]/g, '') // Remove newlines, carriage returns, tabs
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Normaliza múltiplos espaços para um único
}
