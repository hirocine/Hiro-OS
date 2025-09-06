import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function naturalSort(a: string, b: string): number {
  // Split strings into chunks of numbers and non-numbers
  const chunkify = (str: string) => {
    return str.split(/(\d+)/).filter(chunk => chunk.length > 0);
  };
  
  const chunksA = chunkify(a.toLowerCase());
  const chunksB = chunkify(b.toLowerCase());
  
  const maxLength = Math.max(chunksA.length, chunksB.length);
  
  for (let i = 0; i < maxLength; i++) {
    const chunkA = chunksA[i] || '';
    const chunkB = chunksB[i] || '';
    
    // Check if both chunks are numeric
    const isNumA = /^\d+$/.test(chunkA);
    const isNumB = /^\d+$/.test(chunkB);
    
    if (isNumA && isNumB) {
      // Compare as numbers
      const numA = parseInt(chunkA, 10);
      const numB = parseInt(chunkB, 10);
      if (numA !== numB) {
        return numA - numB;
      }
    } else {
      // Compare as strings
      if (chunkA !== chunkB) {
        return chunkA.localeCompare(chunkB);
      }
    }
  }
  
  return 0;
}
