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
